import Database from 'better-sqlite3';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DIR_MIGRACIONES = join(RAIZ, 'db/migrations');

export const RUTA_DB_POR_DEFECTO = process.env.DB_PATH ?? join(RAIZ, 'data/clientes.db');

/**
 * Abre la base de datos y aplica los PRAGMA que queremos en todas las conexiones.
 *
 * foreign_keys y journal_mode no se pueden tocar dentro de una transacción,
 * así que se fijan aquí, antes de nada.
 */
export function abrirDb(ruta = RUTA_DB_POR_DEFECTO, { soloLectura = false } = {}) {
  if (!soloLectura) mkdirSync(dirname(ruta), { recursive: true });

  const db = new Database(ruta, { readonly: soloLectura });
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  return db;
}

function listarMigraciones() {
  return readdirSync(DIR_MIGRACIONES)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((fichero) => {
      const version = Number.parseInt(fichero.slice(0, 3), 10);
      if (!Number.isInteger(version) || version < 1) {
        throw new Error(`Migración con prefijo no numérico: ${fichero}`);
      }
      return { version, fichero, ruta: join(DIR_MIGRACIONES, fichero) };
    });
}

/**
 * Aplica las migraciones pendientes. La versión aplicada vive en
 * `PRAGMA user_version`; no hace falta tabla de control.
 *
 * Cada migración va en su propia transacción: si la 002 falla, la 001 sigue
 * aplicada y user_version queda en 1.
 */
export function migrar(db) {
  const migraciones = listarMigraciones();

  for (const [i, m] of migraciones.entries()) {
    if (m.version !== i + 1) {
      throw new Error(`Hueco o duplicado en las migraciones: esperaba ${i + 1}, encontré ${m.fichero}`);
    }
  }

  const actual = db.pragma('user_version', { simple: true });
  const pendientes = migraciones.filter((m) => m.version > actual);

  for (const m of pendientes) {
    const sql = readFileSync(m.ruta, 'utf8');
    db.transaction(() => {
      db.exec(sql);
      // No admite parámetros: es un PRAGMA. La versión sale del nombre del
      // fichero, ya validado como entero, así que no hay inyección posible.
      db.pragma(`user_version = ${m.version}`);
    })();
  }

  return { versionPrevia: actual, versionActual: db.pragma('user_version', { simple: true }), aplicadas: pendientes.map((m) => m.fichero) };
}

/** Abre la base, la migra al día y la devuelve lista para usar. */
export function abrirYMigrar(ruta = RUTA_DB_POR_DEFECTO) {
  const db = abrirDb(ruta);
  migrar(db);
  return db;
}

/** Tablas y número de filas — para comprobar de un vistazo que todo está en su sitio. */
export function resumen(db) {
  const tablas = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
    .all()
    .map((f) => f.name);

  return {
    version: db.pragma('user_version', { simple: true }),
    tablas: tablas.map((nombre) => ({
      nombre,
      filas: db.prepare(`SELECT count(*) AS n FROM "${nombre}"`).get().n,
    })),
  };
}
