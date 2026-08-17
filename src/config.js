import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Versión del auditor. Se guarda en cada auditoría: sin esto no se puede
 * comparar un informe viejo con uno nuevo al recalibrar.
 * Súbela cuando cambie algo que altere los hallazgos.
 */
export const VERSION_AUDITOR = '0.1.0';

/** Directorio raíz de capturas e informes. */
export const DIR_SALIDAS = process.env.DIR_SALIDAS ?? join(RAIZ, 'out');

/**
 * Token del bot. Es el nombre con el que nos identificamos en el user-agent y
 * con el que buscamos reglas en robots.txt.
 */
export const TOKEN_BOT = 'ClientesBot';

/**
 * Contacto publicado en el user-agent, para que quien vea el bot en sus logs
 * sepa a quién escribir. Configúralo en .env.
 */
export const CONTACTO = process.env.AUDIT_CONTACTO ?? '';

/**
 * User-agent móvil real + nuestro token al final.
 *
 * Compromiso deliberado: un UA puramente de bot hace que muchas tiendas
 * sirvan la versión de escritorio o una página degradada, y entonces la
 * auditoría móvil no vale nada. Manteniendo la cadena de Chrome móvil vemos
 * lo que ve un cliente, y el token + contacto al final nos deja identificados
 * en los logs de quien reciba la visita.
 */
export function userAgent() {
  const identidad = CONTACTO
    ? `${TOKEN_BOT}/${VERSION_AUDITOR} (+${CONTACTO})`
    : `${TOKEN_BOT}/${VERSION_AUDITOR}`;

  return (
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    `Chrome/140.0.0.0 Mobile Safari/537.36 ${identidad}`
  );
}

/** Espera mínima entre peticiones al mismo host, salvo que robots.txt pida más. */
export const RETARDO_MIN_MS = Number(process.env.RETARDO_MIN_MS ?? 2000);

/** Tope de espera que aceptamos de un Crawl-delay antes de rendirnos. */
export const RETARDO_MAX_MS = Number(process.env.RETARDO_MAX_MS ?? 30000);

export const TIEMPOS = {
  robotsMs: Number(process.env.TIMEOUT_ROBOTS_MS ?? 10000),
  navegacionMs: Number(process.env.TIMEOUT_NAVEGACION_MS ?? 30000),
  reposoRedMs: Number(process.env.TIMEOUT_REPOSO_MS ?? 10000),
};

export const VIEWPORTS = {
  movil: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  escritorio: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
};
