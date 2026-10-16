/** Primera visita: campaña y página de llegada. Nunca incluye IP ni el correo. */
export type Origen = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
  referrer?: string;
  landing?: string;
};

const UTM = ["utm_source", "utm_medium", "utm_campaign", "gclid"] as const;
const COMPLETO = [...UTM, "referrer", "landing"] as const;

export const COOKIE_ORIGEN = "oc_origen";
export const COOKIE_ORIGEN_ALTA = "oc_origen_alta";

function texto(valor: unknown, max: number) {
  if (typeof valor !== "string") return "";
  const limpio = valor.replace(/[\n\r\0]/g, "").trim();
  return limpio.slice(0, max);
}

/** Deja solo los campos previstos. Sin `completo`, solo UTM y gclid (sin consentimiento). */
export function limpiarOrigen(bruto: unknown, completo: boolean): Origen | null {
  if (!bruto || typeof bruto !== "object") return null;
  const fila = bruto as Record<string, unknown>;
  const claves = completo ? COMPLETO : UTM;
  const origen: Origen = {};
  for (const clave of claves) {
    const valor = texto(fila[clave], clave === "landing" || clave === "referrer" ? 300 : 120);
    if (!valor) continue;
    if (clave === "landing") {
      if (valor.startsWith("/") && !valor.startsWith("//")) origen.landing = valor;
      continue;
    }
    if (clave === "referrer") {
      const seguro = referrerSeguro(valor, "https://origen-interno.invalid");
      if (seguro) origen.referrer = seguro;
      continue;
    }
    origen[clave] = valor;
  }
  return Object.keys(origen).length > 0 ? origen : null;
}

export function origenDeParametros(params: URLSearchParams): Origen | null {
  const bruto: Record<string, string> = {};
  for (const clave of UTM) {
    const valor = params.get(clave);
    if (valor) bruto[clave] = valor;
  }
  return limpiarOrigen(bruto, false);
}

/** Referrer sin query, para no guardar tokens que vengan en la URL. */
export function referrerSeguro(referrer: string, origenActual: string) {
  try {
    const url = new URL(referrer);
    if (url.origin === origenActual) return "";
    return `${url.origin}${url.pathname}`.slice(0, 300);
  } catch {
    return "";
  }
}

