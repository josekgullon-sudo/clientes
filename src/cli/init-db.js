#!/usr/bin/env node
/**
 * Crea o actualiza la base de datos.
 *
 *   npm run db:init            # migra al día
 *   npm run db:info            # solo informa, no toca nada
 *   DB_PATH=/otra/ruta.db npm run db:init
 */
import { abrirDb, migrar, resumen, RUTA_DB_POR_DEFECTO } from '../db/index.js';

const soloInfo = process.argv.includes('--info');
const ruta = process.env.DB_PATH ?? RUTA_DB_POR_DEFECTO;

const db = abrirDb(ruta);

try {
  if (!soloInfo) {
    const { versionPrevia, versionActual, aplicadas } = migrar(db);
    if (aplicadas.length === 0) {
      console.log(`Sin cambios. Esquema ya en la versión ${versionActual}.`);
    } else {
      console.log(`Migrado ${versionPrevia} -> ${versionActual}:`);
      for (const f of aplicadas) console.log(`  aplicada ${f}`);
    }
  }

  const { version, tablas } = resumen(db);
  console.log(`\n${ruta}  (esquema v${version})`);
  for (const t of tablas) {
    console.log(`  ${t.nombre.padEnd(20)} ${String(t.filas).padStart(6)} filas`);
  }
} finally {
  db.close();
}
