import Link from "next/link";
import { ArrowRight, Check, Crown, Flame, Gauge, RotateCcw } from "lucide-react";
import { EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { CtaFija } from "@/components/cta-fija";
import { Faq } from "@/components/faq";
import { PreguntaPortada } from "@/components/inicio/pregunta-portada";
import { Clara } from "@/components/mascota/clara";
import { Pie } from "@/components/pie";
import { Comparativa } from "@/components/planes/comparativa";
import { diasHastaExamenEstimado, examenEstimado } from "@/lib/examen";
import { paginaPublica, resumenBanco, rutasPublicas } from "@/lib/seo/banco";
import { CUOTA_GRATIS } from "@/lib/sitio";

export default function Inicio() {
  const banco = resumenBanco();
  const examen = examenEstimado();
  // Preguntas cortas y fáciles de la demo para responder en la portada.
  const paraPortada = (paginaPublica("demo")?.preguntas ?? [])
    .filter((p) => p.enunciado.length <= 120 && Math.max(...p.opciones.map((o) => o.length)) <= 48)
    .sort((a, b) => a.dificultad - b.dificultad)
    .slice(0, 3);
  const dias = diasHastaExamenEstimado();
  const leyes = rutasPublicas()
    .filter((r) => r.tipo === "ley")
    .map((r) => paginaPublica(r.slug))
    .filter((p) => p && p.totalBanco > 0);
  const temas = rutasPublicas()
    .filter((r) => r.tipo === "tema")
    .map((r) => paginaPublica(r.slug))
    .filter((p) => p && p.totalBanco > 0);

  const faq = [
    {
      q: "¿Qué incluye el plan gratis?",
      a: `${CUOTA_GRATIS} preguntas al día con su explicación, el repaso de tus fallos, los niveles 1 y 2 de cada tema y un simulacro de prueba. Sin tarjeta.`,
    },
    {
      q: "¿De dónde salen las preguntas?",
      a: "Las escribimos a partir del texto consolidado del BOE y cada una cita su artículo. Si una reforma cambia la ley, actualizamos la pregunta.",
    },
    {
      q: "¿Está todo el temario?",
      a: "Todavía no. Hay preguntas en la mayoría de temas jurídicos del bloque I. El bloque II (ofimática y actividad administrativa) está en preparación.",
    },
    {
      q: "¿La fecha del examen es oficial?",
      a: examen?.nota ?? "Es una estimación. La fecha oficial la publica el BOE.",
    },
    {
      q: "¿Cómo cancelo Premium?",
      a: "Desde tu cuenta, en un clic. Sigues con Premium hasta el final del periodo pagado y no hay permanencia.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const cifras = [
    { n: banco.preguntas.toLocaleString("es-ES"), l: "preguntas revisadas" },
    { n: String(banco.temasConPreguntas), l: "temas con test" },
    { n: dias !== null && dias > 0 ? String(dias) : "—", l: "días al examen*" },
  ];

  return (
    <>
      <Cabecera />
      <main className="flex-1 overflow-x-clip">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

        {/* Portada */}
        <section className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(60%_60%_at_80%_20%,var(--pino-suave),transparent_70%)]"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 md:grid-cols-[1.1fr_1fr] md:pt-20 md:pb-24">
            <div className="aparecer">
              <p className="inline-flex items-center gap-2 rounded-full border border-filete bg-superficie px-3 py-1 text-sm font-semibold text-pizarra shadow-tarjeta">
                <span className="size-2 rounded-full bg-pino" aria-hidden="true" />
                Auxiliar Administrativo del Estado
              </p>
              <h1 className="mt-5 font-display text-[2.375rem] leading-[1.08] font-extrabold tracking-tight md:text-[3.75rem]">
                Test que te explican <span className="subrayado subrayado-titular">cada respuesta</span>.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-pizarra md:text-xl">
                Diez minutos al día. Cada pregunta cita el artículo exacto del BOE y tus fallos vuelven hasta que los
                dominas.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <EnlaceBoton href="/demo" className="sm:px-8">
                  Empezar gratis <ArrowRight aria-hidden size={20} />
                </EnlaceBoton>
                <EnlaceBoton href="#planes" variante="texto" className="sm:px-4">
                  Ver planes
                </EnlaceBoton>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-pizarra">
                {["Sin registro para probar", "Sin tarjeta", "Hecho para el móvil"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check aria-hidden size={16} className="text-pino" strokeWidth={3} /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="aparecer [animation-delay:120ms]">
              {paraPortada.length > 0 ? (
                <PreguntaPortada preguntas={paraPortada} />
              ) : null}
            </div>
          </div>
        </section>

        <section aria-label="El banco en cifras" className="border-y border-filete bg-superficie">
          <ul className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-filete px-2 py-7">
            {cifras.map((c) => (
              <li key={c.l} className="px-2 text-center">
                <p className="cifras font-display text-3xl font-extrabold md:text-5xl">{c.n}</p>
                <p className="mt-1 text-xs font-semibold text-pizarra md:text-sm">{c.l}</p>
              </li>
            ))}
          </ul>
          {examen && (
            <p className="mx-auto max-w-6xl px-4 pb-4 text-center text-xs text-pizarra">
              *Estimación: {examen.etiqueta}. La fecha oficial la publica el BOE.
            </p>
          )}
        </section>

        {/* Lo que nos diferencia, enseñado con piezas reales de la app. */}
        <section aria-labelledby="diferente" className="bloque">
          <div className="mx-auto max-w-6xl px-4">
            <p className="antetitulo">Por qué funciona</p>
            <h2 id="diferente" className="mt-2 max-w-2xl font-display text-[2rem] leading-tight font-extrabold md:text-[2.5rem]">
              Estudias entendiendo, no memorizando letras.
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-pizarra">
              Cada respuesta trae el porqué y el artículo. Y la app decide qué toca hoy, para que no pierdas tiempo.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <article className="tarjeta p-6">
                <Clara pose="senala" animada={false} className="size-20" />
                <h3 className="mt-4 text-xl font-bold">Un camino por temas</h3>
                <p className="mt-1 text-pizarra">Cinco niveles por tema y un examen final. Siempre sabes qué toca hoy.</p>
                <ol className="camino mt-5" aria-hidden="true">
                  {[
                    { n: 1, t: "La Constitución Española", e: "corona", nivel: 5 },
                    { n: 2, t: "La Corona y las Cortes", e: "actual", nivel: 2 },
                    { n: 3, t: "El Poder Judicial", e: "pendiente", nivel: 1 },
                  ].map((p) => (
                    <li key={p.n} className="camino-paso !pb-3" data-estado={p.e}>
                      <span className="camino-nodo">{p.e === "corona" ? <Crown size={17} /> : p.n}</span>
                      <span className="pt-1.5">
                        <span className="block font-semibold">{p.t}</span>
                        <span className="niveles mt-1.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} data-hecho={n < p.nivel || p.e === "corona"} data-actual={n === p.nivel && p.e !== "corona"} />
                          ))}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </article>

              <article className="tarjeta p-6">
                <Clara pose="animo" animada={false} className="size-20" />
                <h3 className="mt-4 text-xl font-bold">Tus fallos vuelven</h3>
                <p className="mt-1 text-pizarra">Repaso espaciado: lo que fallas aparece otra vez justo antes de olvidarlo.</p>
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-papel p-4" aria-hidden="true">
                  <span className="grid size-11 place-items-center rounded-xl bg-pino-suave text-pino">
                    <RotateCcw size={20} />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold">Repasa tus fallos</span>
                    <span className="text-sm text-pizarra">Hoy toca repasar</span>
                  </span>
                  <span className="rounded-full bg-teja-suave px-2.5 py-0.5 text-sm font-bold text-teja">6</span>
                </div>
              </article>

              <article className="tarjeta p-6">
                <Clara pose="celebra" animada={false} className="size-20" />
                <h3 className="mt-4 text-xl font-bold">Sabes cómo vas</h3>
                <p className="mt-1 text-pizarra">Racha diaria, acierto por tema y predicción de nota con la penalización real.</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center" aria-hidden="true">
                  {[
                    { v: "12", t: "días", i: <Flame size={16} className="text-teja" /> },
                    { v: "78 %", t: "acierto", i: <Check size={16} className="text-pino" /> },
                    { v: "31,5", t: "sobre 50", i: <Gauge size={16} className="text-oro-texto" /> },
                  ].map((d) => (
                    <div key={d.t} className="rounded-2xl bg-papel py-3">
                      <p className="flex items-center justify-center gap-1 text-lg font-extrabold">
                        {d.i}
                        {d.v}
                      </p>
                      <p className="text-xs font-semibold text-pizarra">{d.t}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="planes" aria-labelledby="titulo-planes" className="bloque scroll-mt-16">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <p className="antetitulo">Planes</p>
              <h2 id="titulo-planes" className="mt-2 font-display text-[2rem] leading-tight font-extrabold md:text-[2.5rem]">
                Empieza gratis. Pasa a Premium cuando quieras.
              </h2>
            </div>
            <div className="mt-10">
              <Comparativa ctaGratis="/demo" ctaPremium="/entrar?registro=1&siguiente=/suscripcion" />
            </div>
          </div>
        </section>

        <section aria-labelledby="practica" className="bloque border-t border-filete bg-superficie">
          <div className="mx-auto max-w-6xl px-4">
            <p className="antetitulo">Test gratis, sin registro</p>
            <h2 id="practica" className="mt-2 font-display text-[2rem] leading-tight font-extrabold md:text-[2.5rem]">
              Practica por ley o por tema
            </h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {leyes.map((l) => (
                <li key={l!.slug}>
                  <Link
                    href={`/test/${l!.slug}`}
                    className="tarjeta flex min-h-16 items-center justify-between gap-3 px-5 py-4 transition hover:border-pino/50"
                  >
                    <span>
                      <span className="block font-bold">{l!.ley?.nombreCorto ?? l!.titulo}</span>
                      <span className="cifras text-sm text-pizarra">{l!.totalBanco} preguntas</span>
                    </span>
                    <ArrowRight aria-hidden size={18} className="shrink-0 text-pino" />
                  </Link>
                </li>
              ))}
            </ul>
            <details className="group mt-6">
              <summary className="enlace inline-flex min-h-11 cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden">
                Ver los {temas.length} temas con test
              </summary>
              <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
                {temas.map((t) => (
                  <li key={t!.slug} className="border-b border-filete">
                    <Link href={`/test/${t!.slug}`} className="flex min-h-12 items-center gap-3 py-2 hover:text-pino">
                      <span className="cifras w-7 shrink-0 font-bold text-pizarra">{t!.tema?.numero}</span>
                      <span className="line-clamp-1">{t!.tema?.titulo ?? t!.titulo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>

        <section aria-labelledby="faq" className="bloque">
          <div className="mx-auto max-w-lectura px-4">
            <h2 id="faq" className="text-center font-display text-[2rem] leading-tight font-extrabold">
              Preguntas frecuentes
            </h2>
            <div className="mt-8">
              <Faq items={faq} />
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 overflow-hidden rounded-[2rem] bg-pino-boton px-6 py-10 text-sobre-pino shadow-[0_6px_0_var(--pino-sombra)] md:flex-row md:items-center md:justify-between md:px-12">
            <Clara pose="celebra" className="size-28 shrink-0 md:order-last" />
            <div className="md:flex-1">
              <h2 className="font-display text-[2rem] leading-tight font-extrabold">Tu primer test, en cinco minutos.</h2>
              <p className="mt-2 opacity-90">Sin registro y sin tarjeta. Si te gusta, guardas tus fallos al crear la cuenta.</p>
            </div>
            <Link
              href="/demo"
              className="inline-flex min-h-14 shrink-0 items-center gap-2 rounded-2xl bg-white px-7 text-[0.9375rem] font-extrabold tracking-wide text-[#15803d] uppercase shadow-[0_4px_0_rgb(0_0_0/0.2)] transition hover:brightness-95 active:translate-y-[3px] active:shadow-none"
            >
              Hacer el test <ArrowRight aria-hidden size={20} />
            </Link>
          </div>
        </section>
      </main>
      <Pie />
      <CtaFija href="/demo" texto="Empezar gratis" />
    </>
  );
}
