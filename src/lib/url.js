/**
 * Normalización de URLs y dominios.
 *
 * `dominioDe` es la clave de deduplicación de la tabla `tiendas`, así que
 * tiene que ser estable: misma tienda escrita de seis maneras -> mismo valor.
 */

/**
 * Acepta lo que se escribe a mano ("ejemplo.es", "www.ejemplo.es/coleccion")
 * y devuelve una URL absoluta normalizada.
 *
 * @returns {URL}
 * @throws si no hay forma de interpretarlo como http(s)
 */
export function normalizarUrl(entrada) {
  const texto = String(entrada ?? '').trim();
  if (texto === '') throw new Error('URL vacía');

  const conEsquema = /^[a-z][a-z0-9+.-]*:\/\//i.test(texto) ? texto : `https://${texto}`;

  let url;
  try {
    url = new URL(conEsquema);
  } catch {
    throw new Error(`URL no interpretable: ${entrada}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Protocolo no soportado: ${url.protocol}`);
  }
  if (url.hostname === '') throw new Error(`URL sin host: ${entrada}`);

  // El fragmento no llega al servidor: nunca distingue dos auditorías.
  url.hash = '';
  return url;
}

/**
 * Clave de deduplicación: host en minúsculas, sin "www.", sin puerto por
 * defecto. Se conserva un puerto no estándar porque sí distingue un sitio.
 */
export function dominioDe(entrada) {
  const url = entrada instanceof URL ? entrada : normalizarUrl(entrada);
  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  const puertoPorDefecto = (url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80');
  return url.port && !puertoPorDefecto ? `${host}:${url.port}` : host;
}

/** Origen (esquema + host + puerto) — donde vive robots.txt. */
export function origenDe(entrada) {
  const url = entrada instanceof URL ? entrada : normalizarUrl(entrada);
  return url.origin;
}

/** Fragmento seguro para usar como nombre de directorio. */
export function comoNombreDirectorio(dominio) {
  return dominio.replace(/[^a-z0-9.-]+/gi, '_');
}
