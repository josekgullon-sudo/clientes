/**
 * Consentimiento de cookies no técnicas (hoy, solo Google Ads). Se guarda en este navegador.
 * Sin respuesta o con «no», Google Ads no se carga.
 */
export type Consentimiento = "si" | "no" | null;

const CLAVE = "consentimiento-cookies";
const EVENTO = "consentimiento-cookies";

export function leerConsentimiento(): Consentimiento {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === "si" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

export function guardarConsentimiento(valor: Consentimiento) {
  try {
    if (valor) localStorage.setItem(CLAVE, valor);
    else localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: vale solo para esta visita */
  }
  window.dispatchEvent(new CustomEvent<Consentimiento>(EVENTO, { detail: valor }));
}

/** Avisa cuando cambia la elección en esta pestaña. Devuelve la función para dejar de escuchar. */
export function alCambiarConsentimiento(fn: (valor: Consentimiento) => void) {
  const oyente = (e: Event) => fn((e as CustomEvent<Consentimiento>).detail);
  window.addEventListener(EVENTO, oyente);
  return () => window.removeEventListener(EVENTO, oyente);
}
