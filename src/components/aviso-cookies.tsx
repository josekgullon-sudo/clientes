"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CLAVE = "aviso-cookies";

/**
 * Aviso informativo: solo usamos cookies técnicas, que no requieren consentimiento.
 * No aparece durante un test ni en el área privada (tiene barras de acción fijas abajo);
 * para entonces ya se ha visto en la web pública o al entrar.
 */
export function AvisoCookies() {
  const ruta = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let visto = false;
    try {
      visto = localStorage.getItem(CLAVE) === "1";
    } catch {
      /* sin almacenamiento: mostramos el aviso */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depende de localStorage, solo existe en el cliente
    setVisible(!visto);
  }, []);

  const oculto = ruta === "/demo" || ruta.startsWith("/app") || ruta.startsWith("/test/") || ruta.startsWith("/vista");
  if (!visible || oculto) return null;

  function cerrar() {
    try {
      localStorage.setItem(CLAVE, "1");
    } catch {
      /* se volverá a mostrar en la próxima visita */
    }
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl rounded-2xl border border-filete bg-superficie p-3 pl-4 shadow-alta pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-5"
    >
      <div className="flex items-center gap-3">
        <p className="flex-1 text-sm leading-snug">
          Solo usamos cookies técnicas, nada de publicidad.{" "}
          <Link href="/legal/cookies" className="enlace">
            Más información
          </Link>
        </p>
        <button
          type="button"
          onClick={cerrar}
          className="min-h-11 shrink-0 rounded-xl bg-tinta px-4 text-sm font-bold text-papel"
        >
          Vale
        </button>
      </div>
    </div>
  );
}
