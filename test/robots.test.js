import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluarRuta, grupoPara, obtenerRobots, parsearRobots, permiteUrl } from '../src/lib/robots.js';

const permite = (texto, ruta, token = 'ClientesBot') =>
  evaluarRuta(grupoPara(parsearRobots(texto), token), ruta).permitido;

test('sin reglas aplicables se permite', () => {
  assert.equal(permite('', '/'), true);
  assert.equal(permite('User-agent: OtroBot\nDisallow: /', '/'), true);
});

test('"Disallow:" vacío permite, no prohíbe', () => {
  assert.equal(permite('User-agent: *\nDisallow:', '/lo-que-sea'), true);
});

test('gana el patrón más largo, y en empate gana Allow', () => {
  const texto = 'User-agent: *\nDisallow: /privado\nAllow: /privado/publico';
  assert.equal(permite(texto, '/privado/interno'), false);
  assert.equal(permite(texto, '/privado/publico/a'), true);

  const empate = 'User-agent: *\nDisallow: /x\nAllow: /x';
  assert.equal(permite(empate, '/x'), true);
});

test('los comodines * y $ se respetan', () => {
  assert.equal(permite('User-agent: *\nDisallow: /*.pdf$', '/manual.pdf'), false);
  assert.equal(permite('User-agent: *\nDisallow: /*.pdf$', '/manual.pdf?v=2'), true);
  assert.equal(permite('User-agent: *\nDisallow: /a/*/c', '/a/b/c'), false);
});

test('un grupo específico para nuestro token gana al comodín', () => {
  const texto = 'User-agent: *\nDisallow: /\n\nUser-agent: ClientesBot\nDisallow: /carrito';
  assert.equal(permite(texto, '/'), true);
  assert.equal(permite(texto, '/carrito'), false);
  // Otro bot cualquiera sigue cayendo en el grupo comodín.
  assert.equal(permite(texto, '/', 'OtroBot'), false);
});

test('varios User-agent seguidos comparten el mismo bloque de reglas', () => {
  const texto = 'User-agent: ClientesBot\nUser-agent: OtroBot\nDisallow: /nope';
  assert.equal(permite(texto, '/nope'), false);
  assert.equal(permite(texto, '/nope', 'OtroBot'), false);
});

test('los comentarios y el ruido no rompen el parseo', () => {
  const texto = '# cabecera\nUser-agent: *   # todos\nDisallow: /admin # zona privada\nlinea sin dos puntos\n';
  assert.equal(permite(texto, '/admin'), false);
  assert.equal(permite(texto, '/tienda'), true);
});

test('se recogen sitemaps y crawl-delay', () => {
  const r = parsearRobots('Sitemap: https://ejemplo.es/sitemap.xml\nUser-agent: *\nCrawl-delay: 5\nDisallow:');
  assert.deepEqual(r.sitemaps, ['https://ejemplo.es/sitemap.xml']);
  assert.equal(grupoPara(r).crawlDelay, 5);
});

// --- obtención por red (fetch simulado) --------------------------------------

const respuestaFalsa = (status, cuerpo = '') => async () =>
  new Response(cuerpo, { status, headers: { 'content-type': 'text/plain' } });

test('un 404 significa "no hay robots.txt": se permite todo', async () => {
  const r = await obtenerRobots('https://ejemplo.es', { fetchImpl: respuestaFalsa(404) });
  assert.equal(r.estado, 'ausente');
  assert.equal(permiteUrl(r, 'https://ejemplo.es/lo-que-sea').permitido, true);
});

test('un 5xx significa "no lo sé": no entramos', async () => {
  const r = await obtenerRobots('https://ejemplo.es', { fetchImpl: respuestaFalsa(503) });
  assert.equal(r.estado, 'inaccesible');
  const v = permiteUrl(r, 'https://ejemplo.es/');
  assert.equal(v.permitido, false);
  assert.match(v.motivo, /inaccesible/);
});

test('un fallo de red tampoco nos deja entrar', async () => {
  const r = await obtenerRobots('https://ejemplo.es', {
    fetchImpl: async () => {
      throw new Error('ECONNREFUSED');
    },
  });
  assert.equal(r.estado, 'inaccesible');
  assert.equal(permiteUrl(r, 'https://ejemplo.es/').permitido, false);
});

test('un 200 con reglas se aplica a la URL concreta', async () => {
  const r = await obtenerRobots('https://ejemplo.es', {
    fetchImpl: respuestaFalsa(200, 'User-agent: *\nDisallow: /checkout\nCrawl-delay: 2'),
  });
  assert.equal(r.estado, 'ok');
  assert.equal(r.crawlDelayMs, 2000);
  assert.equal(permiteUrl(r, 'https://ejemplo.es/').permitido, true);
  assert.equal(permiteUrl(r, 'https://ejemplo.es/checkout/paso-1').permitido, false);
});
