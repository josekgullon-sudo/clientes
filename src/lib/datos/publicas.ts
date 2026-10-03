import "server-only";
import { supabasePublico } from "@/lib/supabase/servidor";
import { SELECT_PREGUNTA, aPreguntaTest, type FilaPregunta } from "./preguntas";

/** Preguntas gratuitas de una selección: "demo" o el slug de una ley. */
export async function preguntasPublicas(seleccion: string) {
  const { data, error } = await supabasePublico()
    .from("selecciones_publicas")
    .select(`orden, preguntas(${SELECT_PREGUNTA})`)
    .eq("seleccion", seleccion)
    .order("orden");
  if (error) throw new Error(`No se pudieron cargar las preguntas: ${error.message}`);
  return (data as unknown as { preguntas: FilaPregunta | null }[])
    .map((f) => f.preguntas)
    .filter((p): p is FilaPregunta => !!p)
    .map(aPreguntaTest);
}

export async function leyesConTestGratis() {
  const { data, error } = await supabasePublico()
    .from("leyes")
    .select("slug, nombre, nombre_corto, fecha_version_boe");
  if (error) throw new Error(error.message);
  const { data: sel } = await supabasePublico().from("selecciones_publicas").select("seleccion");
  const conPreguntas = new Set((sel ?? []).map((s) => s.seleccion));
  return data.filter((l) => conPreguntas.has(l.slug));
}
