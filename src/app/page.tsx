import Link from "next/link";
import { EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { CtaFija } from "@/components/cta-fija";
import { Pie } from "@/components/pie";
import { Comparativa } from "@/components/planes/comparativa";
import { Explicacion } from "@/components/test/explicacion";
import { examenEstimado, diasHastaExamenEstimado } from "@/lib/examen";
import { resumenBanco, rutasPublicas, paginaPublica } from "@/lib/seo/banco";
import { PRECIOS, SITIO, eur, precioMesEquivalente } from "@/lib/sitio";
import { LETRAS, type PreguntaTest } from "@/lib/test/tipos";

const ejemplo: PreguntaTest = {
  id: "ejemplo",
  enunciado:
    "Cuando la norma reguladora de un procedimiento no fija el plazo máximo para resolver, ¿cuál es ese plazo?",
  opciones: ["Un mes", "Tres meses", "Seis meses", "Dos meses"],
  correcta: 1,
  explicacion:
    "El artículo 21.3 lo resuelve: «Cuando las normas reguladoras de los procedimientos no fijen el plazo máximo, éste será de tres meses».",
  articulo: "21.3",
  ley: "Ley 39/2015",
  tema: null,
};

const pasos = [
  { titulo: "Diez preguntas", texto: "Una sesión corta, del tema que toca. Unos cinco minutos." },
  { titulo: "Ves el artículo", texto: "Cada fallo señala el precepto del BOE, no solo la letra correcta." },
  { titulo: "Mañana, los fallos", texto: "Lo que has fallado vuelve. La racha cuenta si cumples el día." },
];

const faq = [
  {
    q: "¿Sirve si la convocatoria cambia?",
    a: "Las preguntas se apoyan en el artículo de la ley, no en un PDF de academia. Si el BOE reforma el texto, manda el consolidado. El temario de referencia es el de la convocatoria BOE-A-2025-26262.",
  },
  {
    q: "¿Está todo el temario?",
    a: "No. El bloque I tiene preguntas en la mayoría de temas jurídicos. El bloque II (ofimática y atención al público) y algunos temas del bloque I están en preparación. No lo vendemos como el temario completo.",
  },
  {
    q: "¿Qué incluye el plan gratis?",
    a: "Diez preguntas al día de un tema y el repaso de esos fallos, más un simulacro de prueba. Sin tarjeta.",
  },
  {
    q: "¿Cómo cancelo?",
    a: "Desde tu cuenta, en gestionar suscripción. Son dos pasos en el portal de pago. Mantienes el acceso hasta el final del periodo ya pagado. No hay permanencia.",
  },
];

export default function Inicio() {
  const banco = resumenBanco();
  const examen = examenEstimado();
  const dias = diasHastaExamenEstimado();
  const leyes = rutasPublicas()
    .filter((r) => r.tipo === "ley")
    .map((r) => paginaPublica(r.slug))
    .filter((p) => p && p.totalBanco > 0);
  const temas = rutasPublicas()
    .filter((r) => r.tipo === "tema")
    .map((r) => paginaPublica(r.slug))
    .filter((p) => p && p.totalBanco > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Cabecera />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <section className="mx-auto max-w-5xl px-4 pt-10 pb-12 md:grid md:grid-cols-[1.1fr_1fr] md:gap-16 md:pt-20">
          <div>
            <p className="text-[0.95rem] font-semibold text-pino">Auxiliar Administrativo del Estado</p>
            <h1 className="mt-2 max-w-lectura font-serif text-[2.125rem] leading-[1.15] font-semibold md:text-[3rem]">
              Aprueba con diez minutos al día y cada respuesta explicada.
            </h1>
            <p className="mt-4 max-w-lectura font-serif text-[1.125rem] leading-relaxed">
              Cada pregunta trae la explicación y el <span className="subrayado">artículo exacto de la ley</span>. Sabes
              por qué aciertas y por qué fallas.
            </p>
            <div className="mt-7 max-w-sm">
              <EnlaceBoton href="/demo" ancho>
                Hacer un test de 10 preguntas
              </EnlaceBoton>
              <p className="mt-2 text-[0.95rem] text-pizarra">Sin registro. Unos 5 minutos.</p>
            </div>
            <p className="mt-4 max-w-lectura text-[0.95rem] text-pizarra">
              {banco.preguntas} preguntas verificadas con el BOE · {banco.temas} temas del temario · actualizado a la
              convocatoria BOE-A-2025-26262. El bloque II todavía está en preparación.
            </p>
          </div>

          <figure className="mt-12 rounded-xl border border-filete bg-papel-hundido p-5 md:mt-2">
            <figcaption className="text-[0.95rem] font-semibold text-pizarra">Así se corrige cada pregunta</figcaption>
            <p className="mt-3 font-serif text-[1.0625rem] leading-relaxed font-medium">{ejemplo.enunciado}</p>
            <ul className="mt-3 flex flex-col gap-1.5" aria-label="Opciones">
              {ejemplo.opciones.map((o, i) => (
                <li
                  key={o}
                  className={`flex gap-2 rounded-md px-2 py-1.5 ${i === ejemplo.correcta ? "bg-pino-suave font-semibold" : "text-pizarra"}`}
                >
                  <span className="w-5 font-bold">{LETRAS[i]}</span>
                  <span className="flex-1">{o}</span>
                  {i === ejemplo.correcta && <span aria-label="correcta">✓</span>}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Explicacion pregunta={ejemplo} respuesta={ejemplo.correcta} titular={false} />
            </div>
          </figure>
        </section>

        {examen && dias !== null && (
          <section aria-label="Cuenta atrás" className="border-t border-filete bg-papel-hundido">
            <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-5 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="font-semibold">
                Próximo examen estimado: {examen.etiqueta}
                {dias > 0 ? ` · faltan ${dias} días` : ""}
              </p>
              <p className="text-[0.95rem] text-pizarra">{examen.nota}</p>
            </div>
          </section>
        )}

        <section aria-labelledby="habito" className="border-t border-filete">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 id="habito" className="font-serif text-[1.625rem] font-semibold">Así estudias cada día</h2>
            <p className="mt-2 max-w-lectura">Lo que se entrena es el hábito, no un maratón el fin de semana.</p>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {pasos.map((p, i) => (
                <li key={p.titulo} className="rounded-xl border border-filete p-4">
                  <span className="font-serif text-xl text-pino tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 font-semibold">{p.titulo}</h3>
                  <p className="mt-1 text-pizarra">{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="precio" className="border-t border-filete bg-papel-hundido">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 id="precio" className="font-serif text-[1.625rem] font-semibold">Gratis o premium</h2>
            <p className="mt-2 max-w-lectura">
              Una academia suele estar entre 80 y 150 € al mes. El anual de {SITIO.nombre} sale a{" "}
              {eur.format(precioMesEquivalente)} al mes ({eur.format(PRECIOS.anual)} al año).
            </p>
            <div className="mt-6">
              <Comparativa ctaGratis="/demo" ctaPremium="/entrar?registro=1&siguiente=/suscripcion" />
            </div>
          </div>
        </section>

        <section aria-labelledby="faq" className="border-t border-filete">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 id="faq" className="font-serif text-[1.625rem] font-semibold">Preguntas frecuentes</h2>
            <dl className="mt-4 max-w-lectura">
              {faq.map((f) => (
                <div key={f.q} className="border-b border-filete py-4">
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-1 text-pizarra">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="gratis" className="border-t border-filete">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 id="gratis" className="font-serif text-[1.625rem] font-semibold">Test gratis por ley y por tema</h2>
            <p className="mt-2 max-w-lectura">Diez preguntas que cambian cada semana. Sin registro.</p>
            <h3 className="mt-6 font-semibold">Por ley</h3>
            <ul className="mt-2 max-w-xl">
              {leyes.map((l) => (
                <li key={l!.slug} className="border-b border-filete">
                  <Link href={`/test/${l!.slug}`} className="flex min-h-12 items-center justify-between py-2 font-semibold hover:underline">
                    {l!.titulo} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-8 font-semibold">Por tema</h3>
            <ul className="mt-2 max-w-xl">
              {temas.map((t) => (
                <li key={t!.slug} className="border-b border-filete">
                  <Link href={`/test/${t!.slug}`} className="flex min-h-12 items-center justify-between gap-3 py-2 hover:underline">
                    <span>Tema {t!.tema?.numero}. {t!.tema?.titulo}</span>
                    <span className="shrink-0 text-[0.9rem] text-pizarra">{t!.totalBanco}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Pie />
      <CtaFija href="/demo" texto="Haz el test gratis" />
    </>
  );
}
