import Link from "next/link";
import { BookOpen, Flame, Sparkles } from "lucide-react";
import { EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { CtaFija } from "@/components/cta-fija";
import { Faq } from "@/components/faq";
import { IlustracionCamino } from "@/components/ilustracion-camino";
import { Pie } from "@/components/pie";
import { Comparativa } from "@/components/planes/comparativa";
import { diasHastaExamenEstimado, examenEstimado } from "@/lib/examen";
import { paginaPublica, resumenBanco, rutasPublicas } from "@/lib/seo/banco";

const beneficios = [
  { icono: BookOpen, titulo: "El artículo", texto: "El precepto del BOE." },
  { icono: Flame, titulo: "La racha", texto: "Un objetivo, cada día." },
  { icono: Sparkles, titulo: "Empieza gratis", texto: "10 preguntas. Sin tarjeta." },
];

const pasos = [
  { titulo: "Responde", texto: "10 preguntas." },
  { titulo: "Corrige", texto: "Ves el artículo." },
  { titulo: "Repite", texto: "Mañana, los fallos." },
];

export default function Inicio() {
  const banco = resumenBanco();
  const examen = examenEstimado();
  const dias = diasHastaExamenEstimado();
  const leyes = rutasPublicas().filter((r) => r.tipo === "ley").map((r) => paginaPublica(r.slug)).filter((p) => p && p.totalBanco > 0);
  const temas = rutasPublicas().filter((r) => r.tipo === "tema").map((r) => paginaPublica(r.slug)).filter((p) => p && p.totalBanco > 0);

  const faq = [
    {
      q: "¿Sirve si cambia la convocatoria?",
      a: "Las preguntas citan el artículo, no un PDF. El temario de referencia es el de la convocatoria BOE-A-2025-26262.",
    },
    {
      q: "¿Está todo el temario?",
      a: "No. Hay preguntas en la mayoría de temas jurídicos del bloque I. El bloque II y algunos temas siguen en preparación.",
    },
    {
      q: "¿Qué incluye el gratis?",
      a: "10 preguntas al día, el repaso de esos fallos y un simulacro de prueba.",
    },
    {
      q: "¿La fecha del examen es oficial?",
      a: examen?.nota ?? "Es una estimación. La fecha oficial la publica el BOE.",
    },
    {
      q: "¿Cómo cancelo?",
      a: "Desde tu cuenta, en el portal de pago. Sigues hasta el final de lo ya pagado.",
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
    { n: String(banco.preguntas), l: "preguntas" },
    { n: String(banco.temasConPreguntas), l: "temas" },
    { n: dias !== null && dias > 0 ? String(dias) : "—", l: "días al examen" },
  ];

  return (
    <>
      <Cabecera />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 md:grid-cols-2 md:pt-20 md:pb-24">
          <div className="aparecer max-w-lectura">
            <p className="text-sm font-semibold tracking-wide text-pino uppercase">Auxiliar Administrativo</p>
            <h1 className="mt-3 font-serif text-4xl leading-[1.05] font-semibold md:text-6xl">Diez minutos al día.</h1>
            <p className="mt-4 text-lg text-pizarra">Cada respuesta, con el artículo.</p>
            <div className="mt-8 max-w-xs">
              <EnlaceBoton href="/demo" ancho>Empezar gratis</EnlaceBoton>
              <p className="mt-2 text-sm text-pizarra">Sin registro · 5 min</p>
            </div>
          </div>
          <IlustracionCamino />
        </section>

        <section aria-label="Cifras del banco" className="border-y border-filete bg-papel-hundido">
          <ul className="mx-auto grid max-w-6xl grid-cols-3 px-4 py-8">
            {cifras.map((c) => (
              <li key={c.l} className="text-center">
                <p className="font-serif text-3xl font-semibold md:text-4xl">{c.n}</p>
                <p className="text-sm text-pizarra">{c.l}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="beneficios" className="bloque">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="beneficios" className="font-serif text-3xl font-semibold">Por qué funciona</h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {beneficios.map((b) => (
                <li key={b.titulo} className="tarjeta p-6">
                  <span className="grid size-12 place-items-center rounded-2xl bg-pino-suave text-pino">
                    <b.icono aria-hidden size={22} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{b.titulo}</h3>
                  <p className="mt-1 text-pizarra">{b.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="pasos" className="bloque bg-papel-hundido">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="pasos" className="font-serif text-3xl font-semibold">Cómo funciona</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {pasos.map((p, i) => (
                <li key={p.titulo} className="tarjeta p-6">
                  <span className="grid size-10 place-items-center rounded-full bg-pino-boton font-semibold text-sobre-pino">{i + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold">{p.titulo}</h3>
                  <p className="mt-1 text-pizarra">{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="planes" aria-labelledby="planes" className="bloque">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="planes" className="font-serif text-3xl font-semibold">Planes</h2>
            <div className="mt-8">
              <Comparativa ctaGratis="/demo" ctaPremium="/entrar?registro=1&siguiente=/suscripcion" />
            </div>
          </div>
        </section>

        <section aria-labelledby="faq" className="bloque bg-papel-hundido">
          <div className="mx-auto max-w-lectura px-4">
            <h2 id="faq" className="font-serif text-3xl font-semibold">Preguntas</h2>
            <div className="mt-6">
              <Faq items={faq} />
            </div>
          </div>
        </section>

        <section aria-labelledby="practica" className="bloque">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="practica" className="font-serif text-3xl font-semibold">Practica ya</h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {leyes.map((l) => (
                <li key={l!.slug}>
                  <Link href={`/test/${l!.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-filete bg-papel px-4 text-sm font-semibold hover:border-pino hover:bg-pino-suave">
                    {l!.titulo}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-3 flex flex-wrap gap-2">
              {temas.map((t) => (
                <li key={t!.slug}>
                  <Link href={`/test/${t!.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-papel-hundido px-4 text-sm hover:bg-pino-suave">
                    Tema {t!.tema?.numero}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-filete bg-pino-suave">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16 md:flex-row md:items-center md:justify-between">
            <h2 className="font-serif text-3xl font-semibold">Empieza hoy.</h2>
            <EnlaceBoton href="/demo">Hacer el test</EnlaceBoton>
          </div>
        </section>
      </main>
      <Pie />
      <CtaFija href="/demo" texto="Empezar gratis" />
    </>
  );
}
