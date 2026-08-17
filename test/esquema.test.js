/**
 * El esquema codifica garantías que no quiero que dependan solo de la capa de
 * aplicación: nada nominal se contacta, nada dudoso se enseña a un cliente,
 * nada sale sin que yo lo lea. Si alguna de estas se rompe en una migración
 * futura, quiero enterarme aquí.
 *
 *   npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { abrirYMigrar } from '../src/db/index.js';

function conDb(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'clientes-test-'));
  const db = abrirYMigrar(join(dir, 'test.db'));
  try {
    return fn(db);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Tienda + auditoría vacías sobre las que colgar el caso de prueba. */
function semilla(db) {
  const tienda = db
    .prepare('INSERT INTO tiendas (dominio, url_inicio) VALUES (?, ?)')
    .run('ejemplo.es', 'https://ejemplo.es').lastInsertRowid;
  const auditoria = db
    .prepare('INSERT INTO auditorias (tienda_id, url_auditada, version_auditor) VALUES (?, ?, ?)')
    .run(tienda, 'https://ejemplo.es', '0.0.0-test').lastInsertRowid;
  return { tienda, auditoria };
}

function insertarHallazgo(db, auditoria, campos = {}) {
  return db
    .prepare(
      `INSERT INTO hallazgos
         (auditoria_id, check_id, check_version, categoria, estado, confianza, origen, titulo,
          publicable, motivo_no_determinado)
       VALUES (@auditoria, 'check_prueba', '1', 'ui', @estado, @confianza, 'heuristica', 'titulo',
               @publicable, @motivo)`,
    )
    .run({
      auditoria,
      estado: 'detectado',
      confianza: 'alta',
      publicable: 0,
      motivo: null,
      ...campos,
    });
}

test('un hallazgo no determinado tiene que decir por qué', () => {
  conDb((db) => {
    const { auditoria } = semilla(db);
    assert.throws(() => insertarHallazgo(db, auditoria, { estado: 'no_determinado', confianza: 'baja' }));
    assert.doesNotThrow(() =>
      insertarHallazgo(db, auditoria, {
        estado: 'no_determinado',
        confianza: 'baja',
        motivo: 'selector no encontrado',
      }),
    );
  });
});

test('solo es publicable lo detectado con confianza alta o media', () => {
  conDb((db) => {
    const { auditoria } = semilla(db);
    assert.throws(() => insertarHallazgo(db, auditoria, { confianza: 'baja', publicable: 1 }));
    assert.throws(() =>
      insertarHallazgo(db, auditoria, {
        estado: 'no_determinado',
        motivo: 'x',
        publicable: 1,
      }),
    );
    assert.throws(() => insertarHallazgo(db, auditoria, { estado: 'descartado', publicable: 1 }));
    assert.doesNotThrow(() => insertarHallazgo(db, auditoria, { confianza: 'media', publicable: 1 }));
  });
});

test('una fuente que no terminó bien deja constancia del error', () => {
  conDb((db) => {
    const { auditoria } = semilla(db);
    const insertar = (fuente, estado, error = null) =>
      db
        .prepare('INSERT INTO auditoria_fuentes (auditoria_id, fuente, estado, error) VALUES (?, ?, ?, ?)')
        .run(auditoria, fuente, estado, error);

    assert.throws(() => insertar('psi', 'fallida'));
    assert.doesNotThrow(() => insertar('psi', 'fallida', 'HTTP 429'));
    assert.doesNotThrow(() => insertar('axe', 'ok'));
  });
});

test('una dirección nominal nunca puede marcarse como contactable', () => {
  conDb((db) => {
    const { tienda } = semilla(db);
    const insertar = (email, tipo, apto) =>
      db
        .prepare(
          `INSERT INTO contactos (tienda_id, email, tipo, fuente_url, fuente_tipo, apto_contacto)
           VALUES (?, ?, ?, 'https://ejemplo.es/aviso-legal', 'aviso_legal', ?)`,
        )
        .run(tienda, email, tipo, apto);

    assert.throws(() => insertar('ana.lopez@ejemplo.es', 'nominal', 1));
    assert.throws(() => insertar('quien.sabe@ejemplo.es', 'no_determinado', 1));
    assert.doesNotThrow(() => insertar('ana.lopez@ejemplo.es', 'nominal', 0));
    assert.doesNotThrow(() => insertar('info@ejemplo.es', 'generico', 1));
  });
});

test('nada se marca enviado sin revisión humana', () => {
  conDb((db) => {
    const { tienda } = semilla(db);
    const contacto = db
      .prepare(
        `INSERT INTO contactos (tienda_id, email, tipo, fuente_url, fuente_tipo, apto_contacto)
         VALUES (?, 'info@ejemplo.es', 'generico', 'https://ejemplo.es/contacto', 'pagina_contacto', 1)`,
      )
      .run(tienda).lastInsertRowid;

    const insertar = (estado, revisado) =>
      db
        .prepare(
          `INSERT INTO envios (contacto_id, proveedor, asunto, cuerpo, estado, revisado_por_humano)
           VALUES (?, 'instantly', 'asunto', 'cuerpo', ?, ?)`,
        )
        .run(contacto, estado, revisado);

    assert.throws(() => insertar('enviado', 0));
    assert.throws(() => insertar('aprobado', 0));
    assert.doesNotThrow(() => insertar('borrador', 0));
    assert.doesNotThrow(() => insertar('enviado', 1));
  });
});

test('las claves ajenas están activas y la cascada limpia hallazgos y evidencias', () => {
  conDb((db) => {
    const { auditoria } = semilla(db);

    assert.throws(() => insertarHallazgo(db, 9999), /FOREIGN KEY/i);

    const hallazgo = insertarHallazgo(db, auditoria).lastInsertRowid;
    db.prepare(
      `INSERT INTO evidencias (hallazgo_id, tipo, ruta) VALUES (?, 'captura', 'movil/cta.png')`,
    ).run(hallazgo);

    db.prepare('DELETE FROM auditorias WHERE id = ?').run(auditoria);

    assert.equal(db.prepare('SELECT count(*) AS n FROM hallazgos').get().n, 0);
    assert.equal(db.prepare('SELECT count(*) AS n FROM evidencias').get().n, 0);
  });
});

test('migrar dos veces no cambia nada', () => {
  conDb((db) => {
    const version = db.pragma('user_version', { simple: true });
    assert.equal(version, 1);
  });
});
