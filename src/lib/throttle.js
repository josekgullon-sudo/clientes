/**
 * Rate limiting conservador por host.
 *
 * Estado en memoria: vale porque el auditor es un proceso CLI que audita de
 * una en una. El día que haya un crawler concurrente (Fase 2) esto se
 * sustituye por algo compartido — hasta entonces, no compliquemos.
 */
import { RETARDO_MAX_MS, RETARDO_MIN_MS } from '../config.js';

const ultimaPeticion = new Map();

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Espera lo que haga falta antes de volver a tocar `host`.
 *
 * @param {string} host
 * @param {number|null} crawlDelayMs  el Crawl-delay del robots.txt, si lo pidió
 * @returns {Promise<number>} milisegundos realmente esperados
 */
export async function esperarTurno(host, crawlDelayMs = null, { ahora = Date.now, esperar = dormir } = {}) {
  const pedido = crawlDelayMs ?? 0;
  if (pedido > RETARDO_MAX_MS) {
    throw new Error(
      `${host} pide un Crawl-delay de ${Math.round(pedido / 1000)}s, por encima del máximo aceptado ` +
        `(${Math.round(RETARDO_MAX_MS / 1000)}s). No se audita.`,
    );
  }

  const retardo = Math.max(RETARDO_MIN_MS, pedido);
  const previa = ultimaPeticion.get(host);
  const t = ahora();

  let esperado = 0;
  if (previa !== undefined) {
    const restante = previa + retardo - t;
    if (restante > 0) {
      await esperar(restante);
      esperado = restante;
    }
  }

  ultimaPeticion.set(host, ahora());
  return esperado;
}

/** Solo para tests. */
export function reiniciarThrottle() {
  ultimaPeticion.clear();
}
