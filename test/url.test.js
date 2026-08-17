import test from 'node:test';
import assert from 'node:assert/strict';
import { comoNombreDirectorio, dominioDe, normalizarUrl, origenDe } from '../src/lib/url.js';

test('la misma tienda escrita de varias formas da el mismo dominio', () => {
  const formas = [
    'ejemplo.es',
    'https://ejemplo.es',
    'https://www.ejemplo.es',
    'http://WWW.Ejemplo.ES/',
    'https://ejemplo.es/coleccion/rebajas?utm_source=x',
    'https://ejemplo.es/#seccion',
  ];
  for (const f of formas) {
    assert.equal(dominioDe(f), 'ejemplo.es', `falla con "${f}"`);
  }
});

test('un puerto no estándar sí distingue el sitio', () => {
  assert.equal(dominioDe('http://localhost:8080/'), 'localhost:8080');
  assert.equal(dominioDe('https://ejemplo.es:443/'), 'ejemplo.es');
  assert.equal(dominioDe('http://ejemplo.es:80/'), 'ejemplo.es');
});

test('se asume https cuando no se escribe el esquema', () => {
  assert.equal(normalizarUrl('ejemplo.es').protocol, 'https:');
  assert.equal(normalizarUrl('http://ejemplo.es').protocol, 'http:');
});

test('el fragmento se descarta porque nunca llega al servidor', () => {
  assert.equal(normalizarUrl('https://ejemplo.es/a#b').toString(), 'https://ejemplo.es/a');
});

test('la query se conserva porque sí cambia la página servida', () => {
  assert.equal(normalizarUrl('https://ejemplo.es/p?id=3').search, '?id=3');
});

test('se rechaza lo que no es http(s)', () => {
  assert.throws(() => normalizarUrl(''), /vacía/);
  assert.throws(() => normalizarUrl('ftp://ejemplo.es'), /Protocolo/);
  assert.throws(() => normalizarUrl('javascript:alert(1)'), /Protocolo|no interpretable/);
});

test('el origen apunta a donde vive robots.txt', () => {
  assert.equal(origenDe('https://www.ejemplo.es/una/pagina'), 'https://www.ejemplo.es');
});

test('el nombre de directorio no se sale de su sitio', () => {
  assert.equal(comoNombreDirectorio('ejemplo.es'), 'ejemplo.es');
  assert.equal(comoNombreDirectorio('localhost:8080'), 'localhost_8080');
  assert.ok(!comoNombreDirectorio('../../etc/passwd').includes('/'));
});
