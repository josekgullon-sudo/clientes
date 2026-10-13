import type { Metadata } from "next";
import Link from "next/link";
import { Receipt, RotateCcw, ShieldCheck } from "lucide-react";
import { Clara } from "@/components/mascota/clara";
import { redirect } from "next/navigation";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { FormularioPlan } from "@/components/planes/formulario-plan";
import { PRECIOS, eur, precioMesEquivalente } from "@/lib/sitio";
import { supabaseServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Planes", robots: { index: false } };

const motivos: Record<string, { titulo: string; texto: string }> = {
  cuota: { titulo: "Sigue estudiando hoy", texto: "Has usado tus 10 preguntas gratis. Con Premium no hay límite." },
  simulacro: { titulo: "Simulacros sin límite", texto: "Ya has hecho tu simulacro de prueba. Con Premium haces todos los que quieras." },
  personalizado: { titulo: "Test a medida", texto: "Elige los temas y el número de preguntas que quieras." },
  premium: { titulo: "Esto es de Premium", texto: "Niveles avanzados, simulacros y estadísticas completas." },
  nivel: { titulo: "Sube al nivel 3", texto: "El plan gratis llega hasta el nivel 2 de cada tema. Premium abre los cinco y el examen." },
  prediccion: { titulo: "Tu predicción de nota", texto: "Parte 1 y 2 sobre 50, con penalización. El acierto global sigue siendo gratis." },
};

export default async function Suscripcion({ searchParams }: PageProps<"/suscripcion">) {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?registro=1&siguiente=/suscripcion");
  const { data: activa } = await supabase.rpc("tiene_suscripcion_activa");
  if (activa) redirect("/app/cuenta");
  const q = await searchParams;
  const motivo = typeof q.motivo === "string" ? motivos[q.motivo] : undefined;
  const ahorro = Math.round((1 - PRECIOS.anual / (PRECIOS.mensual * 12)) * 100);

  return (
    <>
      <Cabecera inicio="/app" derecha={<Link href="/app" className="inline-flex min-h-11 items-center rounded-xl px-3 font-semibold hover:bg-papel-hundido">Volver</Link>} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-16">
        <div className="text-center">
          <Clara pose="premium" className="mx-auto size-32" />
          <h1 className="mt-4 font-display text-[2.25rem] leading-tight font-extrabold">
            {motivo ? motivo.titulo : "Pasa a Premium"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-pizarra">
            {motivo ? motivo.texto : "Sin límite diario, todos los niveles, simulacros y tu predicción de nota."}
          </p>
        </div>
        {q.error && (
          <p role="alert" className="mt-6 rounded-xl border border-teja bg-teja-suave p-3">
            Ese plan no está disponible ahora mismo. Prueba con el otro o vuelve en un rato.
          </p>
        )}

        <div className="mt-10 grid items-start gap-6 md:grid-cols-2">
          <FormularioPlan
            plan="anual"
            destacado
            titulo="Anual"
            precio={eur.format(precioMesEquivalente)}
            detalle={`${eur.format(PRECIOS.anual)} al año · ahorras un ${ahorro} %`}
            etiqueta="El más elegido"
          />
          <FormularioPlan
            plan="mensual"
            titulo="Mensual"
            precio={eur.format(PRECIOS.mensual)}
            detalle="Lo mismo que el anual, mes a mes y sin permanencia."
          />
        </div>

        <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          {[
            [ShieldCheck, "Pago seguro con Stripe"],
            [RotateCcw, "Cancelas en un clic"],
            [Receipt, "Factura con IVA incluido"],
          ].map(([Icono, t]) => {
            const I = Icono as typeof ShieldCheck;
            return (
              <li key={t as string} className="flex items-center gap-1.5 font-semibold text-pizarra">
                <I aria-hidden size={16} className="text-pino" /> {t as string}
              </li>
            );
          })}
        </ul>

        <p className="mt-6 text-center text-xs text-pizarra">
          Al empezar se aplica la renuncia al desistimiento del art. 103.m, como explican las{" "}
          <Link href="/legal/condiciones" className="underline underline-offset-4">condiciones</Link>.
        </p>
      </main>
      <Pie />
    </>
  );
}
