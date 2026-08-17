/**
 * Prueba de extremo a extremo del esqueleto: servidor local de mentira,
 * Chromium de verdad, base de datos de verdad.
 *
 * No comprueba ningún hallazgo (todavía no hay checks). Comprueba lo que sí
 * tiene que estar bien desde el primer día: que se respeta robots.txt, que
 * las capturas se escriben, y que cada fuente deja constancia de su estado.
 */
import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { abrirYMigrar } from '../src/db/index.js';
import { auditar } from '../src/audit/ejecutar.js';
import { reiniciarThrottle } from '../src/lib/throttle.js';

const PAGINA = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tienda de prueba</title></head>
<body style="margin:0">
  <header style="height:200px;background:#eee">Cabecera</header>
  <main style="height:1600px">Contenido largo para que la captura completa mida más que el viewport</main>
</body></html>`;

/** Lo que el servidor responderá en /robots.txt; cada test lo cambia. */
let robotsRespuesta = { status: 200, cuerpo: 'User-agent: *\nDisallow:\n' };

let servidor;
let base;
let dirTmp;
let db;

before(async () => {
  servidor = createServer((req, res) => {
    if (req.url === '/robots.txt') {
      res.writeHead(robotsRespuesta.status, { 'content-type': 'text/plain' });
      res.end(robotsRespuesta.cuerpo);
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGINA);
  });

  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${servidor.address().port}`;

  dirTmp = mkdtempSync(join(tmpdir(), 'clientes-e2e-'));
  db = abrirYMigrar(join(dirTmp, 'test.db'));
});

beforeEach(() => {
  // Sin esto cada test esperaría el retardo mínimo entre peticiones al host.
  reiniciarThrottle();
});

after(async () => {
  db?.close();
  await new Promise((r) => servidor.close(r));
  rmSync(dirTmp, { recursive: true, force: true });
});

const salidas = () => join(dirTmp, 'out');
const porFuente = (fuentes) => Object.fromEntries(fuentes.map((f) => [f.fuente, f]));

test('una auditoría permitida se completa y deja capturas', async () => {
  robotsRespuesta = { status: 200, cuerpo: 'User-agent: *\nDisallow: /checkout\n' };

  const r = await auditar(db, `${base}/`, { dirSalidas: salidas() });
  assert.equal(r.estado, 'completada', r.error ?? '');

  const dir = join(salidas(), r.dirSalida);
  assert.ok(existsSync(join(dir, 'movil-completa.png')), 'falta la captura completa');
  assert.ok(existsSync(join(dir, 'movil-plegado.png')), 'falta la captura del plegado');

  // La página mide más que el viewport: la completa tiene que pesar más.
  assert.ok(
    statSync(join(dir, 'movil-completa.png')).size > statSync(join(dir, 'movil-plegado.png')).size,
    'la captura completa no parece de página entera',
  );

  const meta = JSON.parse(readFileSync(join(dir, 'pagina.json'), 'utf8'));
  assert.equal(meta.estado_http, 200);
  assert.equal(meta.titulo, 'Tienda de prueba');
  assert.match(meta.user_agent, /ClientesBot/);
  assert.match(meta.user_agent, /Mobile/, 'el user-agent debe seguir siendo móvil');

  const fuentes = porFuente(r.fuentes);
  assert.equal(fuentes.robots.estado, 'ok');
  assert.equal(fuentes.playwright.estado, 'ok');
  // Lo no implementado se marca omitido, no se calla.
  for (const f of ['axe', 'psi', 'anthropic']) {
    assert.equal(fuentes[f].estado, 'omitida', `${f} debería constar como omitida`);
  }

  const fila = db.prepare('SELECT * FROM auditorias WHERE id = ?').get(r.auditoriaId);
  assert.equal(fila.estado, 'completada');
  assert.ok(fila.finalizada_en);
  assert.equal(db.prepare('SELECT count(*) AS n FROM hallazgos WHERE auditoria_id = ?').get(r.auditoriaId).n, 0);
});

test('robots.txt prohibiendo la ruta aborta antes de abrir el navegador', async () => {
  robotsRespuesta = { status: 200, cuerpo: 'User-agent: *\nDisallow: /\n' };

  const r = await auditar(db, `${base}/`, { dirSalidas: salidas() });
  assert.equal(r.estado, 'fallida');
  assert.match(r.error, /robots\.txt no permite/);

  const fuentes = porFuente(r.fuentes);
  assert.equal(fuentes.robots.estado, 'ok');
  assert.equal(fuentes.playwright, undefined, 'no se debió llegar a Playwright');
  assert.ok(!existsSync(join(salidas(), r.dirSalida, 'movil-completa.png')));
});

test('una regla específica para nuestro token se respeta', async () => {
  robotsRespuesta = {
    status: 200,
    cuerpo: 'User-agent: *\nDisallow:\n\nUser-agent: ClientesBot\nDisallow: /\n',
  };

  const r = await auditar(db, `${base}/`, { dirSalidas: salidas() });
  assert.equal(r.estado, 'fallida');
  assert.match(r.error, /robots\.txt no permite/);
});

test('un robots.txt inaccesible impide auditar', async () => {
  robotsRespuesta = { status: 503, cuerpo: 'vaya' };

  const r = await auditar(db, `${base}/`, { dirSalidas: salidas() });
  assert.equal(r.estado, 'fallida');
  assert.match(r.error, /inaccesible/);
  assert.equal(porFuente(r.fuentes).robots.estado, 'fallida');
});

test('sin robots.txt se audita, pero queda registrado como degradado', async () => {
  robotsRespuesta = { status: 404, cuerpo: '' };

  const r = await auditar(db, `${base}/`, { dirSalidas: salidas() });
  assert.equal(r.estado, 'completada', r.error ?? '');

  const robots = porFuente(r.fuentes).robots;
  assert.equal(robots.estado, 'degradada');
  assert.match(robots.error, /no publica robots\.txt/);
});

test('auditar dos veces el mismo dominio no duplica la tienda', async () => {
  robotsRespuesta = { status: 200, cuerpo: 'User-agent: *\nDisallow:\n' };

  await auditar(db, `${base}/`, { dirSalidas: salidas() });
  reiniciarThrottle();
  await auditar(db, `${base}/otra-pagina`, { dirSalidas: salidas() });

  const n = db.prepare('SELECT count(*) AS n FROM tiendas').get().n;
  assert.equal(n, 1, 'el mismo host debería ser una sola tienda');
});
