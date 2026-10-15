"use client";

import { useEffect, useState } from "react";
import { alCambiarConsentimiento, guardarConsentimiento, leerConsentimiento, type Consentimiento } from "@/lib/legal/consentimiento";

/** Muestra la elección guardada y deja cambiarla (en la política de cookies). */
export function CambiarCookies() {
  const [valor, setValor] = useState<Consentimiento>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el consentimiento vive en localStorage, solo en el cliente
    setValor(leerConsentimiento());
    return alCambiarConsentimiento(setValor);
  }, []);

  const texto = valor === "si" ? "Has aceptado las cookies de Google Ads." : valor === "no" ? "Has rechazado las cookies de Google Ads." : "Aún no has elegido: Google Ads no está activo.";

  return (
    <div className="not-prose my-4 flex flex-col gap-3 rounded-2xl border-2 border-filete bg-superficie p-4 sm:flex-row sm:items-center">
      <p className="flex-1 text-sm font-semibold" role="status">
        {texto}
      </p>
      <div className="flex gap-2">
        {valor !== "no" && (
          <button type="button" onClick={() => guardarConsentimiento("no")} className="min-h-11 rounded-xl bg-tinta px-4 text-sm font-bold text-papel">
            Rechazar
          </button>
        )}
        {valor !== "si" && (
          <button type="button" onClick={() => guardarConsentimiento("si")} className="min-h-11 rounded-xl bg-tinta px-4 text-sm font-bold text-papel">
            Aceptar
          </button>
        )}
      </div>
    </div>
  );
}
