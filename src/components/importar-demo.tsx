"use client";

import { useEffect, useState } from "react";
import { importarDemo } from "@/app/app/acciones";
import { CLAVE_DEMO, esDemoGuardada } from "@/lib/test/demo-local";

/** Tras entrar, importa el test público guardado en este dispositivo. */
export function ImportarDemo() {
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    let datos: unknown;
    try {
      const crudo = localStorage.getItem(CLAVE_DEMO);
      if (!crudo) return;
      datos = JSON.parse(crudo);
    } catch {
      return;
    }
    if (!esDemoGuardada(datos)) return;
    const fallos = datos.fallos;
    void importarDemo(datos).then((r) => {
      if (r && "ok" in r && r.ok) {
        try {
          localStorage.removeItem(CLAVE_DEMO);
        } catch {
          /* ya importado */
        }
        setMensaje(
          fallos
            ? `Hemos guardado tus ${fallos} ${fallos === 1 ? "fallo" : "fallos"} del test. Puedes repasarlos hoy.`
            : "Hemos guardado el test que hiciste sin cuenta.",
        );
      }
    });
  }, []);

  if (!mensaje) return null;
  return (
    <p role="status" className="aparecer rounded-2xl border border-pino/40 bg-pino-suave px-4 py-3 font-semibold text-pino">
      {mensaje}
    </p>
  );
}
