import type { Metadata } from "next";
import Link from "next/link";
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

  const intro = (
    <>
      <Cabecera />
      <main className="mx-auto w-full max-w-lectura flex-1 px-4 pt-8 pb-28">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <nav aria-label="Migas" className="text-[0.9rem] text-pizarra">
          <Link href="/" className="underline underline-offset-4">Inicio</Link>
          <span aria-hidden="true"> · </span>
          <span>{pagina.tipo === "ley" ? "Por ley" : `Bloque ${pagina.tema?.bloque}`}</span>
        </nav>
        <p className="mt-4 text-[0.95rem] font-semibold text-pizarra">Auxiliar Administrativo del Estado</p>
        <h1 className="mt-2 font-serif text-[2rem] leading-[1.15] font-semibold md:text-[2.4rem]">{pagina.h1}</h1>
        {parrafos.map((p) => (
          <p key={p.slice(0, 24)} className="mt-4 font-serif text-[1.05rem] leading-relaxed">{p}</p>
        ))}

        {pagina.preguntas.length > 0 && (
          <section aria-labelledby="preguntas" className="mt-10">
            <h2 id="preguntas" className="font-serif text-xl font-semibold">Qué te vas a encontrar</h2>
            <ol className="mt-2">
              {pagina.preguntas.map((p, i) => (
                <li key={p.id} className="flex gap-3 border-b border-filete py-3">
                  <span className="w-6 shrink-0 text-pizarra tabular-nums">{i + 1}.</span>
                  <span>
                    {p.enunciado}
                    <span className="mt-1 block text-[0.9rem] text-pizarra">
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
          <p className="mt-8 rounded-md border border-filete bg-papel-hundido p-4" role="status">
            En preparación. Puedes practicar mientras tanto con los temas que ya tienen preguntas.
          </p>
        )}

        {pagina.temasRelacionados.length > 0 && (
          <section aria-labelledby="temas" className="mt-10">
            <h2 id="temas" className="font-serif text-xl font-semibold">Temas del examen donde entra</h2>
            <ul className="mt-2">
              {pagina.temasRelacionados.map((t) => (
                <li key={t.slug} className="border-b border-filete">
                  <Link href={`/test/${t.slug}`} className="flex min-h-12 items-center justify-between gap-3 py-2 font-semibold hover:underline">
                    <span>Tema {t.numero}. {t.titulo}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pagina.leyesRelacionadas.length > 0 && (
          <section aria-labelledby="leyes" className="mt-10">
            <h2 id="leyes" className="font-serif text-xl font-semibold">Leyes de este tema</h2>
            <ul className="mt-2">
              {pagina.leyesRelacionadas.map((l) => (
                <li key={l.slug} className="border-b border-filete">
                  <Link href={`/test/${l.slug}`} className="flex min-h-12 items-center justify-between py-2 font-semibold hover:underline">
                    {l.nombreCorto} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="faq" className="mt-10">
          <h2 id="faq" className="font-serif text-xl font-semibold">Preguntas frecuentes</h2>
          <dl className="mt-2">
            {faq.map((f) => (
              <div key={f.q} className="border-b border-filete py-3">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1 text-pizarra">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {pagina.siguiente && (
          <p className="mt-8">
            <Link href={pagina.siguiente.href} className="font-semibold underline underline-offset-4">
              Siguiente: {pagina.siguiente.texto}
            </Link>
          </p>
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
