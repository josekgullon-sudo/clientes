import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Boton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { PRECIOS, eur } from "@/lib/sitio";
import { supabaseServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Planes", robots: { index: false } };

export default async function Suscripcion({ searchParams }: PageProps<"/suscripcion">) {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?registro=1&siguiente=/suscripcion");
  const { data: activa } = await supabase.rpc("tiene_suscripcion_activa");
  if (activa) redirect("/app/cuenta");
  const q = await searchParams;
  const ahorro = Math.round((1 - PRECIOS.anual / (PRECIOS.mensual * 12)) * 100);

  const planes = [
    { id: "anual", nombre: "Anual", precio: `${eur.format(PRECIOS.anual)} al año`, nota: `Ahorras un ${ahorro} %. Equivale a ${eur.format(PRECIOS.anual / 12)} al mes.` },
    { id: "mensual", nombre: "Mensual", precio: `${eur.format(PRECIOS.mensual)} al mes`, nota: "Sin permanencia." },
  ];

  return (
    <>
      <Cabecera derecha={<Link href="/app" className="inline-flex min-h-11 items-center px-2 font-semibold">Panel</Link>} />
      <main className="mx-auto w-full max-w-lectura flex-1 px-4 pt-10 pb-16">
        <h1 className="font-serif text-[2rem] leading-tight font-semibold">Elige tu plan</h1>
        <p className="mt-2 font-serif text-[1.125rem]">
          Los dos incluyen todo: test por tema, repaso de fallos, simulacros y tu progreso.
        </p>
        {q.error && (
          <p role="alert" className="mt-6 rounded-md border border-teja bg-teja-suave p-3">
            Ese plan no está disponible ahora mismo. Prueba con el otro o vuelve en un rato.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-6">
          {planes.map((p) => (
            <form key={p.id} action="/api/stripe/checkout" method="post" className="border-t border-filete pt-5">
              <input type="hidden" name="plan" value={p.id} />
              <h2 className="font-serif text-xl font-semibold">{p.nombre}</h2>
              <p className="mt-1 text-[1.25rem] font-semibold">{p.precio}</p>
              <p className="mt-1 text-pizarra">{p.nota}</p>
              <Boton type="submit" ancho variante={p.id === "anual" ? "principal" : "secundario"} className="mt-4">
                Elegir plan {p.nombre.toLowerCase()}
              </Boton>
            </form>
          ))}
        </div>
        <p className="mt-8 text-[0.95rem] text-pizarra">
          Pago seguro con Stripe. IVA incluido y factura en tu correo. Cancelas cuando quieras desde tu cuenta y
          mantienes el acceso hasta el final del periodo pagado. Consulta las{" "}
          <Link href="/legal/condiciones" className="underline underline-offset-4">
            condiciones de suscripción
          </Link>
          .
        </p>
      </main>
      <Pie />
    </>
  );
}
