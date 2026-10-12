import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { FormularioPlan } from "@/components/planes/formulario-plan";
import { PRECIOS, eur, precioMesEquivalente } from "@/lib/sitio";
import { supabaseServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Planes", robots: { index: false } };

const motivos: Record<string, { titulo: string; texto: string }> = {
  cuota: { titulo: "Límite de hoy", texto: "Con Premium sigues ahora." },
  simulacro: { titulo: "Simulacro de prueba usado", texto: "Premium no tiene límite." },
  personalizado: { titulo: "Test personalizado", texto: "Varios temas y el número que elijas." },
  premium: { titulo: "Esto es Premium", texto: "Niveles avanzados y simulacros." },
  nivel: { titulo: "Nivel de pago", texto: "El gratis llega hasta el nivel 2." },
  prediccion: { titulo: "Predicción de nota", texto: "El % global sigue siendo gratis." },
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
      <Cabecera derecha={<Link href="/app" className="inline-flex min-h-11 items-center px-2 font-semibold">Panel</Link>} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-16">
        <h1 className="font-serif text-4xl font-semibold">Planes</h1>

        {motivo && (
          <section className="mt-6 rounded-xl border border-pino bg-pino-suave p-4" role="status">
            <h2 className="font-serif text-xl font-semibold">{motivo.titulo}</h2>
            <p className="mt-1">{motivo.texto}</p>
          </section>
        )}
        {q.error && (
          <p role="alert" className="mt-6 rounded-md border border-teja bg-teja-suave p-3">
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
            etiqueta="Más elegido"
          />
          <FormularioPlan
            plan="mensual"
            titulo="Mensual"
            precio={eur.format(PRECIOS.mensual)}
            detalle="Al mes, sin permanencia. Cancelas cuando quieras."
          />
        </div>

        <p className="mt-8 text-sm text-pizarra">
          IVA incluido. Cancelas en tu cuenta. Al empezar se aplica la renuncia del art. 103.m, en las{" "}
          <Link href="/legal/condiciones" className="underline underline-offset-4">condiciones</Link>.
        </p>
      </main>
      <Pie />
    </>
  );
}
