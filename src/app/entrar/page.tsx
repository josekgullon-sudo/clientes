import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Cabecera } from "@/components/cabecera";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

const errores: Record<string, string> = {
  google: "No hemos podido conectar con Google. Prueba con tu correo.",
  enlace: "El enlace ha caducado o ya se usó. Pide uno nuevo.",
};

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const q = await searchParams;
  const siguiente = typeof q.siguiente === "string" ? q.siguiente : "/app";
  const registro = q.registro === "1";

  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(siguiente.startsWith("/") ? siguiente : "/app");

  const error = typeof q.error === "string" ? errores[q.error] : undefined;

  return (
    <>
      <Cabecera derecha={<span />} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-10 pb-16">
        <h1 className="font-serif text-[2rem] leading-tight font-semibold">
          {registro ? "Crea tu cuenta" : "Entra en tu cuenta"}
        </h1>
        <p className={`mt-2 font-serif text-[1.125rem] ${registro ? "mb-4" : "mb-8"}`}>
          {registro ? "Gratis: 10 preguntas al día, tu racha y tus fallos guardados." : "Con el mismo correo con el que te registraste."}
        </p>
        {registro && (
          <ul className="mb-8 flex flex-col gap-1 text-[0.95rem] text-pizarra">
            <li>En el móvil, Google es el camino más corto.</li>
            <li>Si usas el correo, el código de 6 dígitos vale en este dispositivo.</li>
          </ul>
        )}
        {error && (
          <p role="alert" className="mb-6 rounded-md border border-teja bg-teja-suave p-3">
            {error}
          </p>
        )}
        <FormularioEntrar siguiente={siguiente} registro={registro} />
        <p className="mt-8 text-[0.9rem] text-pizarra">
          Al continuar aceptas las{" "}
          <Link href="/legal/condiciones" className="underline underline-offset-4">
            condiciones
          </Link>{" "}
          y la{" "}
          <Link href="/legal/privacidad" className="underline underline-offset-4">
            política de privacidad
          </Link>
          .
        </p>
      </main>
    </>
  );
}
