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

  const oculto = ruta === "/demo" || ruta.startsWith("/app") || ruta.startsWith("/test/");
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
      className="fixed inset-x-0 bottom-0 z-20 border-t border-filete bg-papel-hundido pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.95rem]">
          Solo usamos cookies técnicas para que puedas entrar y recordar tus preferencias. Nada de publicidad.{" "}
          <Link href="/legal/cookies" className="underline underline-offset-4">
            Más información
          </Link>
        </p>
        <button
          type="button"
          onClick={cerrar}
          className="min-h-11 shrink-0 rounded-md bg-tinta px-5 font-semibold text-papel"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
