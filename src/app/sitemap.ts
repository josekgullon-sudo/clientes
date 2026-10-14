import type { MetadataRoute } from "next";
import { rutasPublicas } from "@/lib/seo/banco";
import { SITIO } from "@/lib/sitio";

export const revalidate = 3600;

// /admin no se incluye: es privado y lleva noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  const paginas = rutasPublicas();
  return [
    { url: SITIO.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITIO.url}/test`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITIO.url}/reto`, changeFrequency: "daily", priority: 0.8 },
    ...paginas.map((p) => ({
      url: `${SITIO.url}/test/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: p.tipo === "ley" ? 0.8 : 0.7,
    })),
    ...["aviso-legal", "privacidad", "cookies", "condiciones"].map((p) => ({
      url: `${SITIO.url}/legal/${p}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
