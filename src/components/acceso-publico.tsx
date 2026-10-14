"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { clasesBoton } from "./boton";

/** Acceso de la web pública. Con sesión, la misma lectura que /app: getClaims. */
export function AccesoPublico() {
  const [conSesion, setConSesion] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const supabase = supabaseNavegador();
    let activo = true;
    supabase.auth
      .getClaims()
      .then(({ data }) => {
        if (activo && data?.claims?.sub) setConSesion(true);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  if (conSesion) {
    return (
      <Link href="/app" className="inline-flex min-h-11 items-center px-3 font-semibold hover:text-pino">
        Estudiar
      </Link>
    );
  }

  return (
    <>
      <Link href="/entrar" className="inline-flex min-h-11 items-center px-3 font-semibold hover:text-pino">
        Entrar
      </Link>
      <span className="ml-1 hidden sm:block">
        <Link href="/demo" className={clasesBoton("principal", false, "md")}>
          Empezar gratis
        </Link>
      </span>
    </>
  );
}
