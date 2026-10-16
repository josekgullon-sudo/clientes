import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, ListChecks, Scale } from "lucide-react";
import { EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { Faq } from "@/components/faq";
import { Pie } from "@/components/pie";
import { TestConIntro } from "@/components/test/test-con-intro";
import { MuestraPreguntas } from "@/components/seo/muestra-preguntas";
import type { PaginaPublica } from "@/lib/seo/banco";
import { deNorma, introLey, introLeyOposiciones } from "@/lib/seo/textos";
import { SITIO } from "@/lib/sitio";

export function PaginaLey({
  pagina,
  otras,
}: {
  pagina: PaginaPublica;
  otras: { slug: string; nombre: string; total: number }[];
}) {
  const ley = pagina.ley;
  if (!ley) return null;

  const otras_opos = pagina.oposiciones.length > 0;
  const parrafos = otras_opos
    ? introLeyOposiciones({
        nombre: ley.nombre,
        nombreCorto: ley.nombreCorto,
        fecha: ley.fecha,
        total: pagina.totalBanco,
        enPagina: pagina.preguntas.length,
        articulos: pagina.articulos,
        oposiciones: pagina.oposiciones,
      })
    : introLey({
        nombre: ley.nombre,
        nombreCorto: ley.nombreCorto,
        fecha: ley.fecha,
        total: pagina.totalBanco,
        enPagina: pagina.preguntas.length,
        articulos: pagina.articulos,
        temas: pagina.temasRelacionados,
      });

  const faq = [
    {
      q: `¿Cuántas preguntas hay ${deNorma(ley.nombreCorto)}?`,
      a: `En el banco hay ${pagina.totalBanco} validadas. Esta página enseña ${pagina.preguntas.length}, que cambian cada semana. Con una cuenta sigues con el resto.`,
    },
    {
      q: "¿Sirve si cambia la convocatoria?",
      a: "Las preguntas citan el artículo del BOE. Si una reforma cambia el texto, manda el consolidado oficial. Actualizamos el banco cuando cambia la norma.",
    },
    {
      q: "¿Estas preguntas son las del examen?",
      a: `No. Son de práctica, alineadas con el temario de ${otras_opos ? pagina.oposiciones.join(", ") : "Auxiliar Administrativo"}. El examen lo pone la Administración. No somos una web oficial.`,
    },
    {
      q: "¿Tengo que registrarme?",
      a: "No para estas preguntas. Si creas una cuenta gratuita, guardamos los fallos y puedes repasarlos, con diez preguntas al día.",
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
          about: { "@type": "Legislation", name: ley.nombre },
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
        { "@type": "ListItem", position: 2, name: "Test", item: `${SITIO.url}/test` },
        { "@type": "ListItem", position: 3, name: ley.nombreCorto, item: `${SITIO.url}/test/${pagina.slug}` },
      ],
    },
  ].filter(Boolean);

  const iconos = [
    { icono: ListChecks, texto: `${pagina.preguntas.length} preguntas` },
    { icono: BookOpen, texto: "Artículo del BOE" },
    { icono: Scale, texto: "Sin registro" },
  ];

  const cuerpo = (
    <>
      <Cabecera />
      <main className="mx-auto w-full max-w-lectura flex-1 px-4 pt-8 pb-32">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <nav aria-label="Migas" className="flex flex-wrap items-center gap-1.5 text-sm text-pizarra">
          <Link href="/" className="hover:text-pino hover:underline">
            Inicio
          </Link>
          <ChevronRight aria-hidden size={14} />
          <Link href="/test" className="hover:text-pino hover:underline">
            Test
          </Link>
          <ChevronRight aria-hidden size={14} />
          <span>{ley.nombreCorto}</span>
        </nav>

        <p className="antetitulo mt-8">{otras_opos ? pagina.oposiciones.join(" · ") : "Auxiliar Administrativo del Estado"}</p>
        <h1 className="mt-3 font-display text-[1.85rem] leading-[1.12] font-extrabold tracking-tight md:text-[2.6rem]">
          {pagina.h1}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-pizarra">{parrafos[0]}</p>

        <ul className="mt-6 grid grid-cols-3 gap-2">
          {iconos.map(({ icono: Icono, texto }) => (
            <li
              key={texto}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-filete bg-superficie px-2 py-3 text-center text-xs font-bold"
            >
              <Icono aria-hidden size={18} className="text-pino" />
              {texto}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-4 text-[1.05rem] leading-relaxed text-pizarra">
          {parrafos.slice(1).map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>

        {pagina.preguntas.length > 0 && (
          <section aria-labelledby="muestra" className="mt-12">
            <h2 id="muestra" className="font-display text-2xl font-extrabold">
              Prueba {pagina.preguntas.length} preguntas
            </h2>
            <p className="mt-2 text-pizarra">Abre cada una para ver la respuesta, la explicación y el artículo.</p>
            <MuestraPreguntas preguntas={pagina.preguntas} />
          </section>
        )}

        <section aria-labelledby="seguir" className="mt-12 rounded-[1.75rem] bg-pino-suave px-5 py-6">
          <h2 id="seguir" className="font-display text-2xl font-extrabold">
            Sigue con el test completo
          </h2>
          <p className="mt-2 text-pizarra">
            Estas preguntas son una muestra. Con una cuenta gratis guardamos tus fallos y abres el resto del banco, diez
            al día.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <EnlaceBoton href="/entrar?registro=1">Crear cuenta gratis</EnlaceBoton>
            <EnlaceBoton href="/test" variante="secundario">
              Ver más leyes
            </EnlaceBoton>
          </div>
        </section>

        {otras.length > 0 && (
          <section aria-labelledby="otras" className="mt-12">
            <h2 id="otras" className="text-lg font-bold">
              {otras_opos ? "Otras normas" : "Otras leyes del temario"}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {otras.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/test/${l.slug}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-filete bg-superficie px-4 font-semibold transition hover:border-pino/50"
                  >
                    {l.nombre}
                    <ArrowRight aria-hidden size={15} className="text-pino" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pagina.temasRelacionados.length > 0 && (
          <section aria-labelledby="temas" className="mt-12">
            <h2 id="temas" className="text-lg font-bold">
              Temas donde entra
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {pagina.temasRelacionados.map((t) => (
                <li key={t.slug}>
                  <Link href={`/test/${t.slug}`} className="enlace inline-flex min-h-11 items-center">
                    {t.oposicion ? `${t.oposicion} · ` : ""}Tema {t.numero}. {t.titulo}
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
      </main>
      <Pie />
    </>
  );

  if (pagina.preguntas.length === 0) return cuerpo;

  return (
    <TestConIntro preguntas={pagina.preguntas} salirA={`/test/${pagina.slug}`} origen={pagina.slug} siguiente={pagina.siguiente}>
      {cuerpo}
    </TestConIntro>
  );
}
