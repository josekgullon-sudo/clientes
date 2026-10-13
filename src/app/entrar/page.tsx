import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Clara } from "@/components/mascota/clara";
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
      <Cabecera derecha={null} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-8 pb-16">
        <Clara pose="hola" saludoInfinito className="mx-auto size-28" />
        <h1 className="mt-4 text-center font-display text-[2.25rem] leading-tight font-extrabold">
          {registro ? "Crea tu cuenta gratis" : "Hola de nuevo"}
        </h1>
        {registro ? (
          <ul className="mx-auto mt-4 flex w-fit flex-col gap-2">
            {["10 preguntas al día, con su explicación", "Tu racha y tu progreso por tema", "Los fallos de tu test, guardados"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-pino-suave text-pino" aria-hidden="true">
                  <Check size={13} strokeWidth={3.5} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-center text-pizarra">¡Qué bien verte! Entra con Google o con tu correo.</p>
        )}
        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-teja bg-teja-suave p-3">
            {error}
          </p>
        )}
        <div className="tarjeta mt-8 p-5">
          <FormularioEntrar siguiente={siguiente} registro={registro} />
        </div>
        <p className="mt-6 text-center text-sm text-pizarra">
          {registro ? (
            <>
              ¿Ya tienes cuenta?{" "}
              <Link href={`/entrar?siguiente=${encodeURIComponent(siguiente)}`} className="enlace">
                Entra
              </Link>
            </>
          ) : (
            <>
              ¿Es tu primera vez?{" "}
              <Link href={`/entrar?registro=1&siguiente=${encodeURIComponent(siguiente)}`} className="enlace">
                Crea tu cuenta gratis
              </Link>
            </>
          )}
        </p>
        <p className="mt-6 text-center text-xs text-pizarra">
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
