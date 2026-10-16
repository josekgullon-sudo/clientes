"use client";

import { useEffect, useRef } from "react";
import { COOKIE_ORIGEN, limpiarOrigen, referrerSeguro, type Origen } from "@/lib/crm/origen";
import { alCambiarConsentimiento, leerConsentimiento } from "@/lib/legal/consentimiento";

const UTM = ["utm_source", "utm_medium", "utm_campaign", "gclid"] as const;

function cookieOrigen(): Origen | null {
  const coincidencia = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_ORIGEN}=([^;]*)`));
  if (!coincidencia) return null;
  try {
    return limpiarOrigen(JSON.parse(decodeURIComponent(coincidencia[1])), true);
  } catch {
    return null;
  }
}

/** Con consentimiento: primera visita. Sin él: solo UTM de la URL actual o de la página anterior. */
function origenParaAlta(): Origen | null {
  const params = new URLSearchParams(window.location.search);
  let anteriores: URLSearchParams | null = null;
  try {
    const previa = new URL(document.referrer);
    if (previa.origin === window.location.origin) anteriores = previa.searchParams;
  } catch {
    anteriores = null;
  }
  const utm: Record<string, string> = {};
  for (const clave of UTM) {
    const valor = params.get(clave) || anteriores?.get(clave) || "";
    if (valor) utm[clave] = valor;
  }
  if (leerConsentimiento() !== "si") return limpiarOrigen(utm, false);
  const guardado = cookieOrigen();
  if (guardado) return guardado;
  const landing = `${window.location.pathname}${window.location.search}`.slice(0, 300);
  const referrer = referrerSeguro(document.referrer, window.location.origin);
  return limpiarOrigen({ ...utm, landing, referrer }, true);
}

function guardarCookieOrigen() {
  if (leerConsentimiento() !== "si" || cookieOrigen()) return;
  const origen = origenParaAlta();
  if (!origen) return;
  document.cookie = `${COOKIE_ORIGEN}=${encodeURIComponent(JSON.stringify(origen))}; Path=/; Max-Age=7776000; SameSite=Lax`;
}

/** Si acepta las cookies de publicidad, recuerda la primera visita (UTM, gclid, referrer y landing). */
export function CapturaOrigen() {
  useEffect(() => {
    guardarCookieOrigen();
    return alCambiarConsentimiento(() => guardarCookieOrigen());
  }, []);
  return null;
}

/** Campo del formulario de alta. Sin consentimiento solo viaja el UTM de la URL. */
export function CampoOrigen() {
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const origen = origenParaAlta();
    if (campo.current) campo.current.value = origen ? JSON.stringify(origen) : "";
  }, []);
  return <input ref={campo} type="hidden" name="origen" defaultValue="" />;
}
