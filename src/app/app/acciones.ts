"use server";

import { redirect } from "next/navigation";
import { registrarEvento } from "@/lib/crm/eventos";
import { slugOposicion } from "@/lib/datos/usuario";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { esDemoGuardada } from "@/lib/test/demo-local";
import type { Respuesta } from "@/lib/test/tipos";

const MODOS = ["tema", "mixto", "falladas", "simulacro", "leccion", "repaso", "salto", "nivel", "hoy"] as const;
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
    p_oposicion: await slugOposicion(),
    p_modo: modo,
    p_temas: temas,
    p_num: Number.isFinite(num) ? num : 10,
  });
  if (error) {
    if (error.message.includes("ya_hecho")) redirect("/app");
    const motivo =
      modo === "simulacro"
        ? "simulacro"
        : modo === "mixto"
          ? "personalizado"
          : modo === "leccion" || modo === "salto"
            ? "nivel"
            : "premium";
    if (error.message.includes("cuota_agotada")) {
      await registrarEvento("limite_gratis", { motivo: "cuota" });
      redirect("/suscripcion?motivo=cuota");
    }
    if (error.message.includes("premium_requerido") || error.message.includes("sin_suscripcion")) {
      redirect(`/suscripcion?motivo=${motivo}`);
    }
    if (modo === "nivel" || modo === "hoy") redirect("/app?error=test");
    const clave = Object.keys(mensajes).find((k) => error.message.includes(k));
    redirect(`/app/nuevo?error=${clave ? mensajes[clave] : "general"}${modo === "falladas" ? "&modo=falladas" : ""}`);
  }
  await registrarEvento("test_inicio", { modo, intento: String(data) });
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
  const { data: intento } = await supabase.from("intentos").select("modo").eq("id", intentoId).maybeSingle();
  const modo = typeof intento?.modo === "string" ? intento.modo : "";
  await registrarEvento("test_fin", { intento: intentoId, ...(modo ? { modo } : {}) });
  if (modo === "nivel") await registrarEvento("nivel_fin", { intento: intentoId, modo: "nivel" });
  redirect(`/app/test/${intentoId}`);
}

/** El siguiente test: el de hoy si aún está pendiente y entra en la cuota; si no, el tema que se indica. */
export async function siguienteTest(datos: FormData) {
  const tema = String(datos.get("tema") ?? "");
  const quiereHoy = datos.get("hoy") !== "0";
  const supabase = await supabaseServidor();
  const slug = await slugOposicion();
  const { data: cuota } = await supabase.rpc("cuota_restante");
  const c = (cuota ?? null) as { premium?: boolean; ilimitado?: boolean; tema?: number } | null;
  const puedeTema = !c || c.premium === true || c.ilimitado === true || (c.tema ?? 0) > 0;

  if (quiereHoy && puedeTema) {
    const { estadoTestHoy } = await import("@/lib/datos/retencion");
    const hoy = await estadoTestHoy();
    if (hoy && !hoy.hecho && !hoy.abierto) {
      const { data, error } = await supabase.rpc("crear_intento", {
        p_oposicion: slug,
        p_modo: "hoy",
        p_temas: [],
        p_num: 10,
      });
      if (error?.message.includes("cuota_agotada")) {
        await registrarEvento("limite_gratis", { motivo: "cuota" });
        redirect("/suscripcion?motivo=cuota");
      }
      if (!error && data) {
        await registrarEvento("test_inicio", { modo: "hoy", intento: String(data) });
        redirect(`/app/test/${data}`);
      }
    } else if (hoy?.abierto) {
      redirect(`/app/test/${hoy.abierto}`);
    }
  }

  if (puedeTema && /^[0-9a-f-]{36}$/.test(tema)) {
    const { data, error } = await supabase.rpc("crear_intento", {
      p_oposicion: slug,
      p_modo: "tema",
      p_temas: [tema],
      p_num: 10,
    });
    if (error?.message.includes("cuota_agotada")) {
      await registrarEvento("limite_gratis", { motivo: "cuota" });
      redirect("/suscripcion?motivo=cuota");
    }
    if (error?.message.includes("premium_requerido")) redirect("/suscripcion?motivo=premium");
    if (!error && data) {
      await registrarEvento("test_inicio", { modo: "tema", intento: String(data) });
      redirect(`/app/test/${data}`);
    }
  }
  redirect("/app");
}

/** Quien salta el test de nivel no vuelve a verlo. */
export async function omitirNivel() {
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("omitir_nivel");
  if (!error) await registrarEvento("nivel_salto");
  redirect("/app");
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
