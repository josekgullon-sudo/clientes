import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { FormularioPlan } from "@/components/planes/formulario-plan";
import { Comparativa } from "@/components/planes/comparativa";
import { PRECIOS, eur, precioMesEquivalente } from "@/lib/sitio";
import { supabaseServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Planes", robots: { index: false } };

const motivos: Record<string, { titulo: string; texto: string }> = {
  cuota: {
    titulo: "Has hecho tus 10 preguntas de hoy",
    texto: "Con Premium sigues ahora, sin esperar a mañana, y desbloqueas el simulacro ilimitado. La racha no se pierde por pasar a premium.",
  },
  simulacro: {
    titulo: "El simulacro de prueba ya está usado",
    texto: "Premium incluye simulacros con el formato real, las veces que quieras, con el histórico en tu cuenta.",
  },
  personalizado: {
    titulo: "El test personalizado es de Premium",
    texto: "En gratis eliges un tema y haces 10 preguntas. Premium mezcla temas y el número que tú marques.",
  },
  premium: {
    titulo: "Esto está en el plan de pago",
    texto: "El plan gratis cubre la sesión diaria y el repaso de tus fallos. Lo demás —varios temas, niveles avanzados y simulacros— es Premium.",
  },
  nivel: {
    titulo: "El nivel 3 es de Premium",
    texto: "En gratis practicas los niveles 1 y 2 de cada tema. Premium abre el resto del camino, el examen del tema y el salto.",
  },
  prediccion: {
    titulo: "La predicción de nota es de Premium",
    texto: "El porcentaje global sigue siendo gratis. La estimación con penalización de un tercio, el calendario y las debilidades están en Premium.",
  },
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
  const alDia = PRECIOS.anual / 365;

  return (
    <>
      <Cabecera derecha={<Link href="/app" className="inline-flex min-h-11 items-center px-2 font-semibold">Panel</Link>} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-16">
        <h1 className="font-serif text-[2rem] leading-tight font-semibold">Elige cómo seguir</h1>
        <p className="mt-2 max-w-lectura font-serif text-[1.125rem]">
          El anual es el que más conviene si vas a preparar la oposición en serio.
        </p>

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

        <div className="mt-8">
          <Comparativa mostrarBotones={false} />
        </div>

        <div className="mt-8 grid gap-4">
          <FormularioPlan
            plan="anual"
            destacado
            titulo="Anual"
            precio={eur.format(precioMesEquivalente)}
            detalle={`${eur.format(PRECIOS.anual)} al año · ${eur.format(alDia)} al día · ahorras un ${ahorro} %`}
            etiqueta="Más elegido"
          />
          <FormularioPlan
            plan="mensual"
            titulo="Mensual"
            precio={eur.format(PRECIOS.mensual)}
            detalle="Al mes, sin permanencia. Cancelas cuando quieras."
          />
        </div>

        <ul className="mt-8 flex flex-col gap-2 text-[0.95rem]">
          <li>Cancelas en dos clics desde tu cuenta. El acceso sigue hasta el final de lo pagado.</li>
          <li>Pago con Stripe. Si tu dispositivo lo permite, Checkout ofrece tarjeta, Apple Pay o Google Pay.</li>
          <li>
            Al empezar el contenido digital se aplica la renuncia al desistimiento del art. 103.m, como se explica en las{" "}
            <Link href="/legal/condiciones" className="underline underline-offset-4">condiciones</Link>.
          </li>
        </ul>
        <p className="mt-6 text-[0.95rem] text-pizarra">IVA incluido y factura en tu correo.</p>
      </main>
      <Pie />
    </>
  );
}
