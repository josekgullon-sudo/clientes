/**
 * Ejecuta una auditoría de una URL.
 *
 * En esta versión el pipeline no aplica ningún check: abre, comprueba
 * robots.txt, captura y cierra dejando la auditoría en base de datos con cero
 * hallazgos. Es el esqueleto sobre el que van los checks.
 *
 * Regla de oro (CLAUDE.md): un fallo de una fuente externa no tumba la
 * auditoría entera. Cada fuente se registra en `auditoria_fuentes` con su
 * estado y su error, y el informe podrá decir qué falta y por qué.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR_SALIDAS, TOKEN_BOT, VERSION_AUDITOR, userAgent } from '../config.js';
import { comoNombreDirectorio, dominioDe, normalizarUrl, origenDe } from '../lib/url.js';
import { obtenerRobots, permiteUrl } from '../lib/robots.js';
import { esperarTurno } from '../lib/throttle.js';
import { abrirNavegador, irA, nuevaPagina } from './navegador.js';

/** Error que corta la auditoría de forma esperada (no es un bug). */
export class AuditoriaAbortada extends Error {
  constructor(mensaje, { fuente } = {}) {
    super(mensaje);
    this.name = 'AuditoriaAbortada';
    this.fuente = fuente ?? null;
  }
}

function selloTiempo() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('Z', 'Z');
}

function registrarFuente(db, auditoriaId, fuente, estado, error = null, duracionMs = null) {
  db.prepare(
    `INSERT INTO auditoria_fuentes (auditoria_id, fuente, estado, error, duracion_ms)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (auditoria_id, fuente) DO UPDATE SET
       estado = excluded.estado, error = excluded.error, duracion_ms = excluded.duracion_ms`,
  ).run(auditoriaId, fuente, estado, error, duracionMs);
}

/** Inserta la tienda si no existe y devuelve su id. */
export function asegurarTienda(db, url) {
  const dominio = dominioDe(url);
  const existente = db.prepare('SELECT id FROM tiendas WHERE dominio = ?').get(dominio);
  if (existente) {
    db.prepare(`UPDATE tiendas SET actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`).run(existente.id);
    return existente.id;
  }
  return db
    .prepare('INSERT INTO tiendas (dominio, url_inicio) VALUES (?, ?)')
    .run(dominio, url.origin + url.pathname).lastInsertRowid;
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {string} urlEntrada
 * @returns {Promise<{auditoriaId:number, estado:string, dirSalida:string, fuentes:object[], error:string|null}>}
 */
export async function auditar(db, urlEntrada, { dirSalidas = DIR_SALIDAS, registrar = () => {} } = {}) {
  const url = normalizarUrl(urlEntrada);
  const dominio = dominioDe(url);

  const tiendaId = asegurarTienda(db, url);
  const dirRelativo = join(comoNombreDirectorio(dominio), selloTiempo());
  const dirAbsoluto = join(dirSalidas, dirRelativo);
  // El directorio se crea cuando hay algo que escribir: una auditoría que
  // robots.txt bloquea no debe dejar carpetas vacías por el disco.

  const auditoriaId = db
    .prepare(
      `INSERT INTO auditorias (tienda_id, url_auditada, version_auditor, user_agent, dir_salida)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(tiendaId, url.toString(), VERSION_AUDITOR, userAgent(), dirRelativo).lastInsertRowid;

  registrar(`auditoría #${auditoriaId} · ${dominio}`);

  let navegador = null;
  try {
    // --- robots.txt ---------------------------------------------------------
    const t0 = Date.now();
    const robots = await obtenerRobots(origenDe(url), { userAgent: userAgent() });
    registrarFuente(
      db,
      auditoriaId,
      'robots',
      robots.estado === 'ok' ? 'ok' : robots.estado === 'ausente' ? 'degradada' : 'fallida',
      robots.estado === 'ausente' ? 'el sitio no publica robots.txt; se asume permitido' : robots.error,
      Date.now() - t0,
    );

    const veredicto = permiteUrl(robots, url, TOKEN_BOT);
    registrar(`robots.txt: ${robots.estado} · ${veredicto.permitido ? 'permitido' : 'PROHIBIDO'} (${veredicto.motivo})`);
    if (!veredicto.permitido) {
      throw new AuditoriaAbortada(`robots.txt no permite auditar ${url} (${veredicto.motivo})`, { fuente: 'robots' });
    }

    // --- rate limiting ------------------------------------------------------
    let esperado = 0;
    try {
      esperado = await esperarTurno(url.hostname, robots.crawlDelayMs);
    } catch (e) {
      // Un Crawl-delay desmesurado no es un fallo del navegador: es el sitio
      // diciendo que no quiere tráfico. Se aborta, no se marca Playwright.
      throw new AuditoriaAbortada(e.message, { fuente: 'robots' });
    }
    if (esperado > 0) registrar(`espera ${esperado} ms por rate limiting`);

    // --- navegación y captura ----------------------------------------------
    const t1 = Date.now();
    navegador = await abrirNavegador();
    const { contexto, pagina } = await nuevaPagina(navegador, 'movil');

    let resultado;
    try {
      resultado = await irA(pagina, url.toString());

      mkdirSync(dirAbsoluto, { recursive: true });
      await pagina.screenshot({ path: join(dirAbsoluto, 'movil-completa.png'), fullPage: true });
      await pagina.screenshot({ path: join(dirAbsoluto, 'movil-plegado.png'), fullPage: false });

      writeFileSync(
        join(dirAbsoluto, 'pagina.json'),
        JSON.stringify(
          {
            url_solicitada: url.toString(),
            url_final: resultado.urlFinal,
            estado_http: resultado.estado,
            titulo: resultado.titulo,
            red_en_reposo: resultado.reposo,
            user_agent: userAgent(),
            version_auditor: VERSION_AUDITOR,
            capturado_en: new Date().toISOString(),
          },
          null,
          2,
        ) + '\n',
      );
    } finally {
      await contexto.close().catch(() => {});
    }

    registrarFuente(
      db,
      auditoriaId,
      'playwright',
      resultado.reposo ? 'ok' : 'degradada',
      resultado.aviso,
      Date.now() - t1,
    );
    registrar(`HTTP ${resultado.estado} · "${resultado.titulo}"${resultado.reposo ? '' : ' · red sin reposo'}`);

    // Todavía sin checks: axe, PSI y la capa de juicio no se han ejecutado.
    for (const fuente of ['axe', 'psi', 'anthropic']) {
      registrarFuente(db, auditoriaId, fuente, 'omitida', 'no implementado todavía');
    }

    db.prepare(
      `UPDATE auditorias
          SET estado = 'completada',
              finalizada_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
              informe_ruta = NULL
        WHERE id = ?`,
    ).run(auditoriaId);

    return { auditoriaId, estado: 'completada', dirSalida: dirRelativo, error: null, fuentes: fuentesDe(db, auditoriaId) };
  } catch (e) {
    if (!(e instanceof AuditoriaAbortada)) {
      registrarFuente(db, auditoriaId, 'playwright', 'fallida', e.message);
    }
    db.prepare(
      `UPDATE auditorias
          SET estado = 'fallida',
              finalizada_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
              error = ?
        WHERE id = ?`,
    ).run(e.message, auditoriaId);

    return { auditoriaId, estado: 'fallida', dirSalida: dirRelativo, error: e.message, fuentes: fuentesDe(db, auditoriaId) };
  } finally {
    if (navegador) await navegador.close().catch(() => {});
  }
}

export function fuentesDe(db, auditoriaId) {
  return db
    .prepare('SELECT fuente, estado, error, duracion_ms FROM auditoria_fuentes WHERE auditoria_id = ? ORDER BY fuente')
    .all(auditoriaId);
}
