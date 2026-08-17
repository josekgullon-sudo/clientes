/**
 * robots.txt — obtención y evaluación, siguiendo RFC 9309.
 *
 * Decisiones que importan y no son obvias:
 *
 *   - 4xx (no hay robots.txt)     -> se permite todo. Es lo que dice la RFC.
 *   - 5xx / red / timeout         -> se prohíbe todo. También RFC, y es la
 *                                    postura conservadora que quiero: si no sé
 *                                    lo que el sitio permite, no entro.
 *   - Gana la regla cuyo patrón es más largo; en empate gana Allow.
 *   - "Disallow:" vacío significa permitir, no prohibir.
 */
import { TIEMPOS, TOKEN_BOT } from '../config.js';

/**
 * Convierte un patrón de robots.txt en expresión regular.
 * Soporta los dos comodines del estándar: `*` (cualquier cosa) y `$` (fin).
 */
function patronARegExp(patron) {
  const anclado = patron.endsWith('$');
  const cuerpo = anclado ? patron.slice(0, -1) : patron;

  const escapado = cuerpo
    .split('*')
    .map((trozo) => trozo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');

  return new RegExp(`^${escapado}${anclado ? '$' : ''}`);
}

/**
 * Parsea el texto de un robots.txt en grupos de user-agent.
 *
 * @returns {{grupos: Array<{agentes: string[], reglas: Array<{tipo:'allow'|'disallow', patron:string, regexp:RegExp}>, crawlDelay: number|null}>, sitemaps: string[]}}
 */
export function parsearRobots(texto) {
  const grupos = [];
  const sitemaps = [];
  let grupoActual = null;
  // Varios "User-agent:" seguidos comparten el mismo bloque de reglas.
  let acumulandoAgentes = false;

  for (const lineaCruda of String(texto ?? '').split(/\r?\n/)) {
    const linea = lineaCruda.replace(/#.*$/, '').trim();
    if (linea === '') continue;

    const sep = linea.indexOf(':');
    if (sep === -1) continue;

    const campo = linea.slice(0, sep).trim().toLowerCase();
    const valor = linea.slice(sep + 1).trim();

    if (campo === 'user-agent') {
      if (!acumulandoAgentes) {
        grupoActual = { agentes: [], reglas: [], crawlDelay: null };
        grupos.push(grupoActual);
        acumulandoAgentes = true;
      }
      grupoActual.agentes.push(valor.toLowerCase());
      continue;
    }

    if (grupoActual === null) {
      // Directivas fuera de grupo: solo nos interesa sitemap.
      if (campo === 'sitemap' && valor) sitemaps.push(valor);
      continue;
    }

    acumulandoAgentes = false;

    if (campo === 'allow' || campo === 'disallow') {
      // "Disallow:" sin valor = sin restricción; no genera regla.
      if (valor === '') {
        if (campo === 'disallow') continue;
        continue;
      }
      grupoActual.reglas.push({ tipo: campo, patron: valor, regexp: patronARegExp(valor) });
    } else if (campo === 'crawl-delay') {
      const segundos = Number.parseFloat(valor);
      if (Number.isFinite(segundos) && segundos >= 0) grupoActual.crawlDelay = segundos;
    } else if (campo === 'sitemap' && valor) {
      sitemaps.push(valor);
    }
  }

  return { grupos, sitemaps };
}

/**
 * Elige el grupo aplicable: primero coincidencia exacta con nuestro token,
 * si no el comodín `*`, si no ninguno (y entonces todo permitido).
 */
export function grupoPara(robots, token = TOKEN_BOT) {
  const buscado = token.toLowerCase();
  const especifico = robots.grupos.find((g) => g.agentes.includes(buscado));
  if (especifico) return especifico;
  return robots.grupos.find((g) => g.agentes.includes('*')) ?? null;
}

/**
 * Evalúa una ruta contra un grupo de reglas.
 * @returns {{permitido: boolean, regla: object|null}}
 */
export function evaluarRuta(grupo, ruta) {
  if (grupo === null) return { permitido: true, regla: null };

  let mejor = null;
  for (const regla of grupo.reglas) {
    if (!regla.regexp.test(ruta)) continue;
    if (
      mejor === null ||
      regla.patron.length > mejor.patron.length ||
      // Empate de longitud: gana Allow.
      (regla.patron.length === mejor.patron.length && regla.tipo === 'allow')
    ) {
      mejor = regla;
    }
  }

  if (mejor === null) return { permitido: true, regla: null };
  return { permitido: mejor.tipo === 'allow', regla: mejor };
}

/**
 * Descarga y parsea el robots.txt de un origen.
 *
 * Nunca lanza: devuelve el estado para que quien llame lo registre en
 * `auditoria_fuentes` y decida.
 *
 * @returns {Promise<{estado:'ok'|'ausente'|'inaccesible', robots:object|null, error:string|null, crawlDelayMs:number|null}>}
 */
export async function obtenerRobots(origen, { userAgent, timeoutMs = TIEMPOS.robotsMs, fetchImpl = fetch } = {}) {
  const url = new URL('/robots.txt', origen).toString();
  const corte = AbortSignal.timeout(timeoutMs);

  let respuesta;
  try {
    respuesta = await fetchImpl(url, {
      signal: corte,
      redirect: 'follow',
      headers: userAgent ? { 'user-agent': userAgent } : {},
    });
  } catch (e) {
    return { estado: 'inaccesible', robots: null, error: `no se pudo leer ${url}: ${e.message}`, crawlDelayMs: null };
  }

  if (respuesta.status >= 500) {
    return { estado: 'inaccesible', robots: null, error: `${url} respondió ${respuesta.status}`, crawlDelayMs: null };
  }
  if (respuesta.status >= 400) {
    return { estado: 'ausente', robots: { grupos: [], sitemaps: [] }, error: null, crawlDelayMs: null };
  }

  let texto;
  try {
    texto = await respuesta.text();
  } catch (e) {
    return { estado: 'inaccesible', robots: null, error: `${url} no se pudo leer: ${e.message}`, crawlDelayMs: null };
  }

  const robots = parsearRobots(texto);
  const grupo = grupoPara(robots);
  const crawlDelayMs = grupo?.crawlDelay != null ? Math.round(grupo.crawlDelay * 1000) : null;

  return { estado: 'ok', robots, error: null, crawlDelayMs };
}

/**
 * ¿Podemos pedir esta URL?
 *
 * @param {{estado:string, robots:object|null}} resultado  lo que devolvió obtenerRobots
 * @returns {{permitido: boolean, motivo: string}}
 */
export function permiteUrl(resultado, url, token = TOKEN_BOT) {
  if (resultado.estado === 'inaccesible') {
    return { permitido: false, motivo: 'robots.txt inaccesible: no entramos sin saber qué permite el sitio' };
  }
  if (resultado.estado === 'ausente') {
    return { permitido: true, motivo: 'sin robots.txt' };
  }

  const u = url instanceof URL ? url : new URL(url);
  const ruta = `${u.pathname}${u.search}`;
  const grupo = grupoPara(resultado.robots, token);
  const { permitido, regla } = evaluarRuta(grupo, ruta);

  if (regla === null) return { permitido: true, motivo: 'ninguna regla aplica' };
  return {
    permitido,
    motivo: `${regla.tipo === 'allow' ? 'Allow' : 'Disallow'}: ${regla.patron}`,
  };
}
