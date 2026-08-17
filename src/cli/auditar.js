#!/usr/bin/env node
/**
 * Audita una URL.
 *
 *   npm run auditar -- https://ejemplo.es
 *
 * En esta versión no aplica ningún check: comprueba robots.txt, captura en
 * móvil y deja la auditoría registrada con cero hallazgos.
 */
import { abrirYMigrar } from '../db/index.js';
import { auditar } from '../audit/ejecutar.js';
import { CONTACTO, DIR_SALIDAS, TOKEN_BOT } from '../config.js';

const [, , ...args] = process.argv;
const urls = args.filter((a) => !a.startsWith('-'));

if (urls.length === 0) {
  console.error('Uso: npm run auditar -- <url> [<url>...]');
  process.exit(2);
}

if (!CONTACTO) {
  console.error(
    `aviso: AUDIT_CONTACTO sin configurar. El user-agent se identifica como ${TOKEN_BOT} ` +
      'pero sin forma de contacto. Ponlo en .env antes de auditar sitios de terceros.',
  );
}

const db = abrirYMigrar();
let fallos = 0;

try {
  for (const url of urls) {
    console.log(`\n=== ${url}`);
    let r;
    try {
      r = await auditar(db, url, { registrar: (m) => console.log(`  ${m}`) });
    } catch (e) {
      console.error(`  error no controlado: ${e.message}`);
      fallos++;
      continue;
    }

    console.log(`  -> ${r.estado}${r.error ? `: ${r.error}` : ''}`);
    console.log(`  salida: ${DIR_SALIDAS}/${r.dirSalida}`);
    for (const f of r.fuentes) {
      const detalle = f.error ? ` (${f.error})` : '';
      const ms = f.duracion_ms != null ? ` ${f.duracion_ms}ms` : '';
      console.log(`  · ${f.fuente.padEnd(11)} ${f.estado}${ms}${detalle}`);
    }
    if (r.estado !== 'completada') fallos++;
  }
} finally {
  db.close();
}

process.exit(fallos > 0 ? 1 : 0);
