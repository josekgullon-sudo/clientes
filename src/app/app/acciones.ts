"use server";

import { redirect } from "next/navigation";
import { OPOSICION } from "@/lib/sitio";
import { supabaseServidor } from "@/lib/supabase/servidor";
import type { Respuesta } from "@/lib/test/tipos";

const MODOS = ["tema", "mixto", "falladas", "simulacro"] as const;
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
  const num = Number(datos.get("num") ?? 20);
  const modo: Modo = modoPedido === "tema" || modoPedido === "mixto" ? (temas.length === 1 ? "tema" : "mixto") : modoPedido;

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("crear_intento", {
    p_oposicion: OPOSICION,
    p_modo: modo,
    p_temas: temas,
    p_num: Number.isFinite(num) ? num : 20,
  });
  if (error) {
    const clave = Object.keys(mensajes).find((k) => error.message.includes(k));
    if (clave === "sin_suscripcion") redirect("/suscripcion");
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
