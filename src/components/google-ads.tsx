"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { alCambiarConsentimiento, leerConsentimiento } from "@/lib/legal/consentimiento";

const GOOGLE_ADS = "AW-18513329642";
const configuracion = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GOOGLE_ADS}');`;

/** Etiqueta de Google Ads. Solo se carga si la persona ha aceptado las cookies de publicidad. */
export function GoogleAds() {
  const [aceptado, setAceptado] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el consentimiento vive en localStorage, solo en el cliente
    setAceptado(leerConsentimiento() === "si");
    return alCambiarConsentimiento((v) => {
      // Al retirar el consentimiento recargamos para que la etiqueta ya cargada deje de funcionar.
      if (v !== "si" && window.gtag) window.location.reload();
      else setAceptado(v === "si");
    });
  }, []);

  if (!aceptado) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS}`} strategy="afterInteractive" />
      <Script id="google-ads" strategy="afterInteractive">
        {configuracion}
      </Script>
    </>
  );
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
