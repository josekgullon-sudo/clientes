import "server-only";
import { paginaPublica, preguntasPublicasLocales, rutasPublicas } from "@/lib/seo/banco";

/** Preguntas gratuitas: "demo", el slug de una ley o el slug de un tema. Rotan cada semana. */
export async function preguntasPublicas(seleccion: string) {
  return preguntasPublicasLocales(seleccion);
}

export async function leyesConTestGratis() {
  return rutasPublicas()
    .filter((r) => r.tipo === "ley")
    .map((r) => paginaPublica(r.slug))
    .filter((p) => p && p.totalBanco > 0)
    .map((p) => ({
      slug: p!.slug,
      nombre: p!.ley?.nombre ?? p!.titulo,
      nombre_corto: p!.ley?.nombreCorto ?? p!.titulo,
      fecha_version_boe: p!.ley?.fecha ?? null,
    }));
}
