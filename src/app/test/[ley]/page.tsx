import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { TestConIntro } from "@/components/test/test-con-intro";
import { preguntasPublicas } from "@/lib/datos/publicas";
import { SITIO } from "@/lib/sitio";
import { supabasePublico } from "@/lib/supabase/servidor";

export const revalidate = 3600;

// Se generan bajo demanda y se cachean una hora.
export function generateStaticParams() {
  return [];
}

async function cargarLey(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const { data } = await supabasePublico()
    .from("leyes")
    .select("slug, nombre, nombre_corto, fecha_version_boe")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

const titulo = (corto: string) => (corto === "Constitución" ? "Test de la Constitución Española" : `Test de la ${corto}`);

export async function generateMetadata({ params }: PageProps<"/test/[ley]">): Promise<Metadata> {
  const ley = await cargarLey((await params).ley);
  if (!ley) return {};
  const t = titulo(ley.nombre_corto);
  return {
    title: `${t} · Preguntas con solución`,
    description: `${t} para el Auxiliar Administrativo del Estado: 10 preguntas gratis con la respuesta correcta, la explicación y el artículo exacto.`,
    alternates: { canonical: `/test/${ley.slug}` },
  };
}

export default async function TestLey({ params }: PageProps<"/test/[ley]">) {
  const ley = await cargarLey((await params).ley);
  if (!ley) notFound();
  const preguntas = await preguntasPublicas(ley.slug);
  if (preguntas.length === 0) notFound();
  const t = titulo(ley.nombre_corto);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: t,
    about: { "@type": "Legislation", name: ley.nombre },
    educationalLevel: "Oposiciones",
    url: `${SITIO.url}/test/${ley.slug}`,
    hasPart: preguntas.map((p) => ({
      "@type": "Question",
      name: p.enunciado,
      eduQuestionType: "Multiple choice",
    })),
  };

  return (
    <TestConIntro preguntas={preguntas} salirA={`/test/${ley.slug}`}>
      <Cabecera />
      <main className="mx-auto w-full max-w-lectura flex-1 px-4 pt-10 pb-28">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <p className="text-[0.95rem] font-semibold text-pizarra">Auxiliar Administrativo del Estado</p>
        <h1 className="mt-2 font-serif text-[2.125rem] leading-[1.15] font-semibold">{t}</h1>
        <p className="mt-4 font-serif text-[1.125rem] leading-relaxed">
          {preguntas.length} preguntas gratis sobre la {ley.nombre}. Al responder, ves la correcta, por qué lo es y el{" "}
          <span className="subrayado">artículo exacto</span>.
        </p>
        <p className="mt-2 text-pizarra">Sin registro. Unos 5 minutos.</p>

        <section aria-labelledby="preguntas" className="mt-10">
          <h2 id="preguntas" className="font-serif text-xl font-semibold">
            Qué te vas a encontrar
          </h2>
          <ol className="mt-2">
            {preguntas.map((p, i) => (
              <li key={p.id} className="flex gap-3 border-b border-filete py-3">
                <span className="w-6 shrink-0 text-pizarra tabular-nums">{i + 1}.</span>
                <span>
                  {p.enunciado}
                  <span className="mt-1 block text-[0.9rem] text-pizarra">Art. {p.articulo}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 border-l-[3px] border-subrayador pl-4">
          <h2 className="font-serif text-xl font-semibold">¿Quieres más preguntas de esta ley?</h2>
          <p className="mt-1">
            Con tu cuenta tienes test de todo el temario, repaso de fallos y simulacros.{" "}
            <Link href="/entrar?registro=1" className="font-semibold underline underline-offset-4">
              Crear mi cuenta
            </Link>
          </p>
        </section>
        {ley.fecha_version_boe && (
          <p className="mt-8 text-[0.9rem] text-pizarra">
            Preguntas basadas en el texto consolidado del BOE a{" "}
            {new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(ley.fecha_version_boe))}.
          </p>
        )}
      </main>
      <Pie />
    </TestConIntro>
  );
}
