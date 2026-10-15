"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { alCambiarConsentimiento, guardarConsentimiento, leerConsentimiento } from "@/lib/legal/consentimiento";

/**
 * Banner de consentimiento: las cookies técnicas no lo necesitan, las de Google Ads sí.
 * Aceptar y rechazar pesan lo mismo. No aparece durante un test ni en el área privada (tiene
 * barras de acción fijas abajo); sin respuesta, Google Ads no se carga.
 */
export function AvisoCookies() {
  const ruta = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depende de localStorage, solo existe en el cliente
    setVisible(leerConsentimiento() === null);
    // Si se borra la elección desde la política de cookies, el banner vuelve a salir.
    return alCambiarConsentimiento((v) => setVisible(v === null));
  }, []);

  const oculto =
    ruta === "/demo" ||
    ruta === "/reto" ||
    ruta.startsWith("/app") ||
    ruta.startsWith("/admin") ||
    ruta.startsWith("/test/") ||
    ruta.startsWith("/vista");
  if (!visible || oculto) return null;

  const boton = "min-h-11 flex-1 rounded-xl px-4 text-sm font-bold sm:flex-none";

  return (
    <div
      role="region"
      aria-label="Cookies"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl rounded-2xl border border-filete bg-superficie p-4 shadow-alta pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-5"
    >
      <p className="text-sm leading-snug">
        Usamos cookies técnicas para que la web funcione. Si aceptas, también cookies de Google Ads para saber qué
        anuncios nos traen visitas.{" "}
        <Link href="/legal/cookies" className="enlace">
          Más información
        </Link>
      </p>
      <div className="mt-3 flex gap-2 sm:justify-end">
        <button type="button" onClick={() => guardarConsentimiento("no")} className={`${boton} bg-tinta text-papel`}>
          Rechazar
        </button>
        <button type="button" onClick={() => guardarConsentimiento("si")} className={`${boton} bg-tinta text-papel`}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
