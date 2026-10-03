import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { OPOSICION } from "@/lib/sitio";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { SELECT_PREGUNTA, ordenarPorIds, type FilaPregunta } from "./preguntas";

/** Usuario con sesión y si tiene la suscripción activa. Redirige a /entrar si no hay sesión. */
export const usuarioActual = cache(async () => {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const [{ data: suscrito }, { data: suscripcion }] = await Promise.all([
    supabase.rpc("tiene_suscripcion_activa"),
    supabase.from("suscripciones").select("plan, estado, fin_periodo, stripe_customer_id").maybeSingle(),
  ]);
  return { supabase, user, suscrito: !!suscrito, suscripcion };
});

export const oposicionActual = cache(async () => {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("oposiciones")
    .select("id, slug, nombre, formato_simulacro, temas(id, numero, titulo, bloque)")
    .eq("slug", OPOSICION)
    .order("numero", { referencedTable: "temas" })
    .single();
  if (error) throw new Error(`No se pudo cargar la oposición: ${error.message}`);
  return data as {
    id: string;
    slug: string;
    nombre: string;
    formato_simulacro: { minutos: number; penalizacion: number; partes: { bloque: string; preguntas: number }[]; nota?: string };
    temas: { id: string; numero: number; titulo: string; bloque: string }[];
  };
});

export async function progresoPorTema() {
  const { supabase } = await usuarioActual();
  const { data, error } = await supabase.rpc("progreso_por_tema", { p_oposicion: OPOSICION });
  if (error) throw new Error(error.message);
  return data as {
    tema_id: string;
    numero: number;
    titulo: string;
    bloque: string;
    total: number;
    vistas: number;
    dominadas: number;
  }[];
}

export async function rachaActual() {
  const { supabase } = await usuarioActual();
  const { data } = await supabase.rpc("racha_actual");
  return (data as number | null) ?? 0;
}

export async function ultimosIntentos(n = 5) {
  const { supabase } = await usuarioActual();
  const { data } = await supabase
    .from("intentos")
    .select("id, modo, creado_en, terminado_en, aciertos, fallos, en_blanco, puntuacion, preguntas")
    .not("terminado_en", "is", null)
    .order("creado_en", { ascending: false })
    .limit(n);
  return data ?? [];
}

export async function falladasPendientes() {
  const { supabase } = await usuarioActual();
  const { data } = await supabase
    .from("respuestas")
    .select("pregunta_id, acertada, respondida_en")
    .order("respondida_en", { ascending: false })
    .limit(5000);
  const ultima = new Map<string, boolean>();
  for (const r of data ?? []) if (!ultima.has(r.pregunta_id)) ultima.set(r.pregunta_id, r.acertada);
  return [...ultima.values()].filter((a) => !a).length;
}

export async function intentoConPreguntas(id: string) {
  const { supabase } = await usuarioActual();
  const opo = await oposicionActual();
  const { data: intento } = await supabase.from("intentos").select("*").eq("id", id).maybeSingle();
  if (!intento) return null;
  const { data: filas, error } = await supabase
    .from("preguntas")
    .select(SELECT_PREGUNTA.replace("preguntas_oposiciones(", "preguntas_oposiciones!inner("))
    .in("id", intento.preguntas)
    .eq("preguntas_oposiciones.oposicion_id", opo.id);
  if (error) throw new Error(error.message);
  const preguntas = ordenarPorIds((filas ?? []) as unknown as FilaPregunta[], intento.preguntas);

  let respuestas: Record<string, number | null> = {};
  if (intento.terminado_en) {
    const { data } = await supabase
      .from("respuestas")
      .select("pregunta_id, respuesta_dada")
      .eq("intento_id", id);
    respuestas = Object.fromEntries((data ?? []).map((r) => [r.pregunta_id, r.respuesta_dada]));
  }
  return { intento, preguntas, respuestas };
}
