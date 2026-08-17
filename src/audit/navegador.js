import { chromium } from 'playwright';
import { TIEMPOS, VIEWPORTS, userAgent } from '../config.js';

/**
 * Lanza Chromium. El binario sale de la instalación de Playwright salvo que
 * CHROMIUM_PATH apunte a otro (útil en servidores donde el navegador se
 * gestiona aparte).
 */
export async function abrirNavegador() {
  return chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
}

/**
 * Contexto + página para un viewport. Devuelve también el contexto para poder
 * cerrarlo: cerrar solo la página deja el contexto vivo.
 */
export async function nuevaPagina(navegador, nombreViewport = 'movil') {
  const perfil = VIEWPORTS[nombreViewport];
  if (!perfil) throw new Error(`Viewport desconocido: ${nombreViewport}`);

  const contexto = await navegador.newContext({
    ...perfil,
    userAgent: userAgent(),
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    // Sin cookies ni almacenamiento previos: cada auditoría ve lo que ve un
    // visitante nuevo, que es justo el caso que estamos evaluando.
    storageState: undefined,
  });
  contexto.setDefaultTimeout(TIEMPOS.navegacionMs);

  const pagina = await contexto.newPage();
  return { contexto, pagina };
}

/**
 * Navega y espera a que la página se asiente.
 *
 * `networkidle` se intenta pero no se exige: muchas tiendas tienen píxeles de
 * marketing y chats que nunca callan. Si no llega, seguimos y lo decimos —
 * eso es una captura "degradada", no una auditoría fallida.
 *
 * @returns {Promise<{estado:number|null, urlFinal:string, titulo:string, reposo:boolean, aviso:string|null}>}
 */
export async function irA(pagina, url) {
  const respuesta = await pagina.goto(url, {
    waitUntil: 'load',
    timeout: TIEMPOS.navegacionMs,
  });

  let reposo = true;
  let aviso = null;
  try {
    await pagina.waitForLoadState('networkidle', { timeout: TIEMPOS.reposoRedMs });
  } catch {
    reposo = false;
    aviso = `la red no llegó a reposo en ${TIEMPOS.reposoRedMs} ms; la captura puede no reflejar el estado final`;
  }

  return {
    estado: respuesta?.status() ?? null,
    urlFinal: pagina.url(),
    titulo: await pagina.title().catch(() => ''),
    reposo,
    aviso,
  };
}
