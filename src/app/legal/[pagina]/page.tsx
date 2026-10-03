import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { TEXTOS } from "./textos";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(TEXTOS).map((pagina) => ({ pagina }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[pagina]">): Promise<Metadata> {
  const t = TEXTOS[(await params).pagina];
  return t ? { title: t.titulo, description: t.descripcion } : {};
}

export default async function PaginaLegal({ params }: PageProps<"/legal/[pagina]">) {
  const t = TEXTOS[(await params).pagina];
  if (!t) notFound();
  return (
    <>
      <Cabecera />
      <main className="mx-auto w-full max-w-lectura flex-1 px-4 pt-10 pb-16">
        <h1 className="font-serif text-[2rem] leading-tight font-semibold">{t.titulo}</h1>
        <div className="legal mt-6 font-serif text-[1.0625rem] leading-relaxed">{t.contenido}</div>
      </main>
      <Pie />
    </>
  );
}
