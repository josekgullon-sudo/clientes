import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";
import { supabasePublico } from "@/lib/supabase/servidor";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await supabasePublico().from("selecciones_publicas").select("seleccion");
  const leyes = [...new Set((data ?? []).map((s) => s.seleccion))].filter((s) => s !== "demo");
  return [
    { url: SITIO.url, changeFrequency: "weekly", priority: 1 },
    ...leyes.map((l) => ({ url: `${SITIO.url}/test/${l}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...["aviso-legal", "privacidad", "cookies", "condiciones"].map((p) => ({
      url: `${SITIO.url}/legal/${p}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
