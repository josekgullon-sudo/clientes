import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { Faq } from "@/components/faq";
import { notFound } from "next/navigation";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { TestConIntro } from "@/components/test/test-con-intro";
import { paginaPublica, rutasPublicas } from "@/lib/seo/banco";
import { parrafosLey, parrafosTema } from "@/lib/seo/textos";
import { SITIO } from "@/lib/sitio";

export const revalidate = 3600;

export function generateStaticParams() {
  return rutasPublicas().map((r) => ({ ley: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/test/[ley]">): Promise<Metadata> {
  const pagina = paginaPublica((await params).ley);
  if (!pagina) return {};
  return {
    title: `${pagina.titulo} · Preguntas con solución`,
    description: pagina.descripcion,
    alternates: { canonical: `/test/${pagina.slug}` },
    robots: pagina.enPreparacion ? { index: true, follow: true } : undefined,
  };
}

export default async function TestLey({ params }: PageProps<"/test/[ley]">) {
  const pagina = paginaPublica((await params).ley);
  if (!pagina || pagina.tipo === "demo") notFound();

  const parrafos =
    pagina.tipo === "ley" && pagina.ley
      ? parrafosLey({
          nombre: pagina.ley.nombre,
          nombreCorto: pagina.ley.nombreCorto,
          fecha: pagina.ley.fecha,
          total: pagina.totalBanco,
          enPagina: pagina.preguntas.length,
          articulos: pagina.articulos,
          temas: pagina.temasRelacionados,
        })
      : pagina.tema
        ? parrafosTema({
            numero: pagina.tema.numero,
            titulo: pagina.tema.titulo,
            bloque: pagina.tema.bloque,
            total: pagina.totalBanco,
            enPagina: pagina.preguntas.length,
            leyes: pagina.leyesRelacionadas,
            articulos: pagina.articulos,
          })
        : [];

  const faq = [
    {
      q: "¿Sirve si cambia la convocatoria?",
      a: "Las preguntas citan el artículo del BOE. Si una reforma cambia el texto, manda el consolidado oficial. Actualizamos el banco cuando cambia la norma, no cuando cambia el rumor de la convocatoria.",
    },
    {
      q: "¿Estas preguntas son las del examen?",
      a: "No. Son preguntas de práctica alineadas con el temario. El examen lo pone la Administración. No somos una web oficial.",
    },
    {
      q: "¿Tengo que registrarme?",
      a: "No para estas diez preguntas. Si creas una cuenta gratuita, guardamos los fallos y puedes repasarlos, con diez preguntas al día.",
    },
  ];

  const jsonLd = [
    pagina.preguntas.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: pagina.h1,
          educationalLevel: "Oposiciones",
          url: `${SITIO.url}/test/${pagina.slug}`,
          about: pagina.ley ? { "@type": "Legislation", name: pagina.ley.nombre } : pagina.tema?.titulo,
          hasPart: pagina.preguntas.map((p) => ({
            "@type": "Question",
            name: p.enunciado,
            eduQuestionType: "Multiple choice",
            acceptedAnswer: { "@type": "Answer", text: p.opciones[p.correcta] },
          })),
        }
      : null,
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITIO.url },
        { "@type": "ListItem", position: 2, name: "Test", item: `${SITIO.url}/test/constitucion` },
        { "@type": "ListItem", position: 3, name: pagina.titulo, item: `${SITIO.url}/test/${pagina.slug}` },
      ],
    },
  ].filter(Boolean);

  // «de la Ley 39/2015», «del TREBEP», «del tema 3».
  const deQue =
    pagina.tipo === "tema"
      ? `del tema ${pagina.tema?.numero}`
      : pagina.ley?.nombreCorto === "TREBEP"
        ? "del TREBEP"
        : `de la ${pagina.ley?.nombreCorto ?? pagina.titulo}`;
  const entradilla =
    pagina.preguntas.length > 0
      ? `${pagina.preguntas.length} preguntas ${deQue} con la respuesta explicada y el artículo exacto del BOE.`
      : null;
  const resto = parrafos;

  const intro = (
    <>
      <Cabecera />
      <main className="mx-auto w-full max-w-lectura flex-1 px-4 pt-6 pb-32">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <nav aria-label="Migas" className="flex items-center gap-1.5 text-sm text-pizarra">
          <Link href="/" className="hover:text-pino hover:underline">
            Inicio
          </Link>
          <ChevronRight aria-hidden size={14} />
          <span>{pagina.tipo === "ley" ? "Test por ley" : `Bloque ${pagina.tema?.bloque}`}</span>
        </nav>
        <p className="antetitulo mt-6">Auxiliar Administrativo del Estado</p>
        <h1 className="mt-2 font-display text-[2.25rem] leading-[1.1] font-extrabold md:text-[2.75rem]">{pagina.h1}</h1>
        {entradilla && <p className="mt-4 text-lg text-pizarra">{entradilla}</p>}

        <ul className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
          {[`${pagina.preguntas.length} preguntas`, "Sin registro", "5 minutos"].map((t) => (
            <li key={t} className="cifras flex items-center gap-1.5 rounded-full border border-filete bg-superficie px-3 py-1.5">
              <Check aria-hidden size={14} className="text-pino" strokeWidth={3} /> {t}
            </li>
          ))}
        </ul>

        {pagina.preguntas.length > 0 && (
          <section aria-labelledby="preguntas" className="mt-10">
            <h2 id="preguntas" className="text-lg font-bold">
              Qué te vas a encontrar
            </h2>
            <ol className="tarjeta mt-3 divide-y divide-filete">
              {pagina.preguntas.map((p, i) => (
                <li key={p.id} className="flex gap-3 px-4 py-3.5">
                  <span className="cifras w-6 shrink-0 font-bold text-pizarra">{i + 1}</span>
                  <span className="leading-snug">
                    {p.enunciado}
                    <span className="mt-1 block text-sm font-semibold text-pizarra">
                      Art. {p.articulo}
                      {p.ley ? ` · ${p.ley}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {pagina.enPreparacion && (
          <p className="mt-8 rounded-2xl bg-oro-suave p-4 text-oro-texto" role="status">
            Este tema está en preparación. Mientras tanto, practica con los temas que ya tienen preguntas.
          </p>
        )}

        {resto.length > 0 && (
          <section aria-labelledby="sobre" className="mt-12">
            <h2 id="sobre" className="font-display text-2xl font-extrabold">
              {pagina.tipo === "ley" ? "Sobre esta ley en el examen" : "Sobre este tema"}
            </h2>
            {resto.map((p) => (
              <p key={p.slice(0, 24)} className="mt-4 font-serif text-[1.0625rem] leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        )}

        {pagina.temasRelacionados.length > 0 && (
          <section aria-labelledby="temas" className="mt-12">
            <h2 id="temas" className="text-lg font-bold">
              Temas del examen donde entra
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {pagina.temasRelacionados.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/test/${t.slug}`}
                    className="tarjeta flex min-h-14 items-center gap-3 px-4 py-3 transition hover:border-pino/50"
                  >
                    <span className="cifras grid size-9 shrink-0 place-items-center rounded-full bg-pino-suave text-sm font-extrabold text-pino">
                      {t.numero}
                    </span>
                    <span className="line-clamp-2 flex-1 leading-snug font-semibold">{t.titulo}</span>
                    <ArrowRight aria-hidden size={18} className="shrink-0 text-pino" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pagina.leyesRelacionadas.length > 0 && (
          <section aria-labelledby="leyes" className="mt-12">
            <h2 id="leyes" className="text-lg font-bold">
              Leyes de este tema
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {pagina.leyesRelacionadas.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/test/${l.slug}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-filete bg-superficie px-4 font-semibold transition hover:border-pino/50 hover:text-pino"
                  >
                    {l.nombreCorto} <ArrowRight aria-hidden size={15} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-lg font-bold">
            Preguntas frecuentes
          </h2>
          <div className="mt-3">
            <Faq items={faq} />
          </div>
        </section>

        {pagina.siguiente && (
          <Link
            href={pagina.siguiente.href}
            className="tarjeta mt-10 flex items-center justify-between gap-3 px-5 py-4 transition hover:border-pino/50"
          >
            <span>
              <span className="block text-sm font-semibold text-pizarra">Siguiente</span>
              <span className="font-bold">{pagina.siguiente.texto}</span>
            </span>
            <ArrowRight aria-hidden size={20} className="text-pino" />
          </Link>
        )}
      </main>
      <Pie />
    </>
  );

  if (pagina.preguntas.length === 0) return intro;

  return (
    <TestConIntro
      preguntas={pagina.preguntas}
      salirA={`/test/${pagina.slug}`}
      origen={pagina.slug}
      siguiente={pagina.siguiente}
    >
      {intro}
    </TestConIntro>
  );
}
