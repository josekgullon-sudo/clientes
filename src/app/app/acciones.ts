"use server";

import { redirect } from "next/navigation";
import { OPOSICION } from "@/lib/sitio";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { esDemoGuardada } from "@/lib/test/demo-local";
import type { Respuesta } from "@/lib/test/tipos";

const MODOS = ["tema", "mixto", "falladas", "simulacro", "leccion", "repaso", "salto"] as const;
type Modo = (typeof MODOS)[number];

const mensajes: Record<string, string> = {
  sin_suscripcion: "suscripcion",
  sin_preguntas: "sin-preguntas",
};

/** Crea un intento en el servidor (que elige las preguntas) y abre el test. */
export async function crearTest(datos: FormData) {
  const m = String(datos.get("modo") ?? "mixto");
  const modoPedido: Modo = (MODOS as readonly string[]).includes(m) ? (m as Modo) : "mixto";
  const temas = datos.getAll("tema").map(String).filter((t) => /^[0-9a-f-]{36}$/.test(t));
  const num = Number(datos.get("num") ?? 10);
  const modo: Modo =
    modoPedido === "mixto" ? (temas.length === 1 ? "tema" : "mixto") : modoPedido;

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("crear_intento", {
    p_oposicion: OPOSICION,
    p_modo: modo,
    p_temas: temas,
    p_num: Number.isFinite(num) ? num : 10,
  });
  if (error) {
    const motivo =
      modo === "simulacro"
        ? "simulacro"
        : modo === "mixto"
          ? "personalizado"
          : modo === "leccion" || modo === "salto"
            ? "nivel"
            : "premium";
    if (error.message.includes("cuota_agotada")) redirect("/suscripcion?motivo=cuota");
    if (error.message.includes("premium_requerido") || error.message.includes("sin_suscripcion")) {
      redirect(`/suscripcion?motivo=${motivo}`);
    }
    const clave = Object.keys(mensajes).find((k) => error.message.includes(k));
    redirect(`/app/nuevo?error=${clave ? mensajes[clave] : "general"}${modo === "falladas" ? "&modo=falladas" : ""}`);
  }
  redirect(`/app/test/${data}`);
}

/** Guarda las respuestas; la corrección se calcula en la base de datos. */
export async function terminarTest(intentoId: string, respuestas: Respuesta[]) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("terminar_intento", {
    p_intento: intentoId,
    p_respuestas: respuestas.map((r) => ({
      pregunta_id: r.preguntaId,
      respuesta: r.respuesta,
      tiempo_ms: r.tiempoMs,
    })),
  });
  if (error) return { error: "No hemos podido guardar tus respuestas. Comprueba la conexión y vuelve a pulsar." };
  redirect(`/app/test/${intentoId}`);
}

/** Trae al panel los fallos del test hecho sin cuenta. */
export async function importarDemo(payload: unknown) {
  if (!esDemoGuardada(payload)) return { error: "formato" as const };
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "sesion" as const };
  const { error } = await supabase.rpc("importar_respuestas_demo", { p_respuestas: payload.respuestas });
  if (error) return { error: error.message };
  return { ok: true as const };
}

/** Adelanta una pregunta al repaso de hoy (repetición espaciada). */
export async function marcarRepaso(preguntaId: string) {
  if (!/^[a-z0-9-]+$/.test(preguntaId)) return { error: "pregunta" as const };
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("marcar_repaso", { p_pregunta: preguntaId });
  if (error) return { error: "guardar" as const };
  return { ok: true as const };
}

/** Aviso de una pregunta mal planteada. No cambia la corrección. */
export async function reportarPregunta(preguntaId: string, motivo: string) {
  if (!/^[a-z0-9-]+$/.test(preguntaId)) return { error: "pregunta" as const };
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("reportar_pregunta", {
    p_pregunta: preguntaId,
    p_motivo: motivo.slice(0, 500),
  });
  if (error) return { error: "guardar" as const };
  return { ok: true as const };
}
