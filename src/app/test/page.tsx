import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Eye,
  Flag,
  Gavel,
  HeartHandshake,
  Landmark,
  Monitor,
  Scale,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import { EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { indiceOtrasOposiciones, paginaPublica, rutasPublicas } from "@/lib/seo/banco";
import { SITIO } from "@/lib/sitio";

const ICONOS: Record<string, LucideIcon> = {
  constitucion: Landmark,
  "ley-39-2015": BookOpen,
  "ley-40-2015": Building2,
  "ley-19-2013": Eye,
  "ley-50-1997": Landmark,
  trebep: Users,
  "lo-3-2018": Shield,
  "lo-3-2007": Scale,
  "ley-47-2003": Scale,
  "lo-1-2004": HeartHandshake,
  "rd-208-1996": BookOpen,
  "rd-203-2021": Monitor,
  "rd-951-2005": Scale,
  "ley-7-1985": Building2,
  "lo-6-1985": Gavel,
  tue: Flag,
  tfue: Flag,
  "ley-50-1981": Gavel,
};

export const metadata: Metadata = {
  title: "Test gratis por ley y por tema",
  description:
    "Test gratis de oposiciones de la Administración: Auxiliar, Administrativo, Agente de Hacienda y Tramitación Procesal. Por ley y por tema, con diez preguntas y el artículo del BOE.",
  alternates: { canonical: `${SITIO.url}/test` },
};

export default function IndiceTest() {
  const otras = indiceOtrasOposiciones();
  const leyes = rutasPublicas()
    .filter((r) => r.tipo === "ley" && r.ambito === "aux")
    .map((r) => paginaPublica(r.slug))
    .filter((p) => p && p.totalBanco > 0 && p.ley);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Test gratis por ley",
    itemListElement: leyes.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p!.h1,
      url: `${SITIO.url}/test/${p!.slug}`,
    })),
  };

  return (
    <>
      <Cabecera />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-16">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <p className="antetitulo">Oposiciones de la Administración</p>
        <h1 className="mt-3 font-display text-[2rem] leading-[1.12] font-extrabold tracking-tight md:text-[2.75rem]">
          Test gratis por ley y por tema
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-pizarra">
          Elige una norma o un tema. Cada página trae hasta diez preguntas, la respuesta explicada y el artículo del BOE.
          Sin registro. Las leyes de abajo son las del Auxiliar Administrativo del Estado.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {leyes.map((p) => {
            const Icono = ICONOS[p!.slug] ?? BookOpen;
            return (
              <li key={p!.slug}>
                <Link
                  href={`/test/${p!.slug}`}
                  className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-filete bg-superficie px-4 py-3 transition hover:border-pino/50"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-pino-suave text-pino">
                    <Icono aria-hidden size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{p!.ley!.nombreCorto}</span>
                    <span className="cifras text-sm text-pizarra">{p!.totalBanco} preguntas en el banco</span>
                  </span>
                  <ArrowRight aria-hidden size={18} className="shrink-0 text-pino" />
                </Link>
              </li>
            );
          })}
        </ul>

        {otras.leyes.length > 0 && (
          <section aria-labelledby="otras-normas" className="mt-12">
            <h2 id="otras-normas" className="font-display text-2xl font-extrabold">
              Derecho tributario, procesal y más
            </h2>
            <p className="mt-2 text-pizarra">Normas de Agente de Hacienda, Tramitación Procesal y Administrativo.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {otras.leyes.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/test/${l.slug}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-filete bg-superficie px-4 font-semibold transition hover:border-pino/50"
                  >
                    {l.nombreCorto}
                    <ArrowRight aria-hidden size={15} className="text-pino" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {otras.oposiciones.length > 0 && (
          <section aria-labelledby="por-oposicion" className="mt-12">
            <h2 id="por-oposicion" className="font-display text-2xl font-extrabold">
              Test por tema de otras oposiciones
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {otras.oposiciones.map((o) => (
                <details key={o.slug} className="rounded-2xl border-2 border-filete bg-superficie px-4 py-3">
                  <summary className="min-h-11 cursor-pointer font-bold">
                    {o.nombre} <span className="cifras text-sm font-semibold text-pizarra">· {o.temas.length} temas</span>
                  </summary>
                  <ul className="mt-3 flex flex-col">
                    {o.temas.map((t) => (
                      <li key={t.slug}>
                        <Link href={`/test/${t.slug}`} className="enlace inline-flex min-h-11 items-center">
                          Tema {t.numero}. {t.titulo}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-[1.75rem] bg-pino-suave px-5 py-6">
          <h2 className="font-display text-2xl font-extrabold">¿Quieres guardar los fallos?</h2>
          <p className="mt-2 text-pizarra">Crea una cuenta gratis. Diez preguntas al día y el repaso de lo que fallas.</p>
          <div className="mt-5">
            <EnlaceBoton href="/entrar?registro=1">Crear cuenta gratis</EnlaceBoton>
          </div>
        </section>
      </main>
      <Pie />
    </>
  );
}
