/**
 * Una auditoría que no llega a capturar no debe dejar rastro en el disco.
 * Si no, el directorio de salidas se llena de carpetas vacías de tiendas que
 * ni siquiera nos dejan entrar.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { abrirYMigrar } from '../src/db/index.js';
import { auditar } from '../src/audit/ejecutar.js';
import { reiniciarThrottle } from '../src/lib/throttle.js';

let servidor;
let base;
let dirTmp;
let db;

before(async () => {
  servidor = createServer((req, res) => {
    if (req.url === '/robots.txt') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      return res.end('User-agent: *\nDisallow: /\n');
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<title>x</title>');
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${servidor.address().port}`;
  dirTmp = mkdtempSync(join(tmpdir(), 'clientes-salidas-'));
  db = abrirYMigrar(join(dirTmp, 'test.db'));
});

after(async () => {
  db?.close();
  await new Promise((r) => servidor.close(r));
  rmSync(dirTmp, { recursive: true, force: true });
});

test('una auditoría bloqueada por robots no crea directorio de salida', async () => {
  reiniciarThrottle();
  const salidas = join(dirTmp, 'out');

  const r = await auditar(db, `${base}/`, { dirSalidas: salidas });
  assert.equal(r.estado, 'fallida');
  assert.ok(!existsSync(join(salidas, r.dirSalida)), 'no debería haber creado el directorio');
});
