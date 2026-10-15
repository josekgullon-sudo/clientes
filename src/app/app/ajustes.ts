"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugOposicion } from "@/lib/datos/usuario";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { esOposicion } from "@/lib/sitio";

function objetivoValido(valor: FormDataEntryValue | null) {
  const n = Number(valor);
  return n === 5 || n === 10 || n === 20 || n === 30 ? n : 10;
}

function fechaValida(valor: FormDataEntryValue | null) {
  const s = String(valor ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

export async function guardarAjustes(datos: FormData) {
  const supabase = await supabaseServidor();
  const oposicion = datos.get("oposicion");
  if (esOposicion(oposicion)) await supabase.rpc("elegir_oposicion", { p_slug: oposicion });
  const { error } = await supabase.rpc("guardar_perfil", {
    p_objetivo: objetivoValido(datos.get("objetivo")),
    p_fecha: fechaValida(datos.get("fecha")),
    p_recordatorio: datos.get("recordatorio") === "1",
    p_completar: datos.get("completar") === "1",
  });
  // Los datos del panel dependen del perfil: sin esto el navegador reutiliza el /app que guardó al
  // entrar (una redirección al onboarding) y se queda en blanco.
  if (!error) revalidatePath("/app", "layout");
  const volver = String(datos.get("volver") ?? "");
  const destino = volver.startsWith("/app") && !volver.startsWith("//") ? volver : "/app";
  if (error) redirect(`${destino}${destino.includes("?") ? "&" : "?"}error=ajustes`);

  if (datos.get("empezar") === "1") {
    // Primer tema con preguntas de la oposición elegida (la acaba de guardar, si venía en el formulario).
    const { data: temas } = await supabase.rpc("progreso_por_tema", { p_oposicion: null });
    const tema = ((temas ?? []) as { tema_id: string; total: number }[]).find((t) => t.total > 0)?.tema_id ?? "";
    if (/^[0-9a-f-]{36}$/.test(tema)) {
      const { data, error: test } = await supabase.rpc("crear_intento", {
        p_oposicion: await slugOposicion(),
        p_modo: "tema",
        p_temas: [tema],
        p_num: 10,
      });
      if (!test && data) redirect(`/app/test/${data}`);
    }
  }
  if (datos.get("confirmar") === "1") redirect(`${destino}${destino.includes("?") ? "&" : "?"}guardado=1`);
  redirect(destino);
}

export async function guardarPerfilPublico(datos: FormData) {
  const supabase = await supabaseServidor();
  const alias = String(datos.get("alias") ?? "").trim();
  const { error } = await supabase.rpc("guardar_perfil_publico", {
    p_alias: alias || null,
    p_avatar: String(datos.get("avatar") ?? "") || null,
    p_en_liga: datos.get("en_liga") === "1",
  });
  redirect(error ? "/app/cuenta?error=perfil#perfil" : "/app/cuenta?guardado=perfil#perfil");
}

/** Cambia la oposición que se prepara. Las respuestas se conservan: cuentan en todas las que comparten la pregunta. */
export async function cambiarOposicion(datos: FormData) {
  const oposicion = datos.get("oposicion");
  if (!esOposicion(oposicion)) redirect("/app/cuenta?error=oposicion#oposicion");
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("elegir_oposicion", { p_slug: oposicion });
  if (error) redirect("/app/cuenta?error=oposicion#oposicion");
  revalidatePath("/app", "layout");
  redirect("/app?oposicion=1");
}

export type ResultadoCofre = { xp: number; ya_abierto: boolean; logros: string[] } | { error: true };

/** Abre el cofre del día. Lo llama el botón del cofre en el panel. */
export async function abrirCofre(): Promise<ResultadoCofre> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("abrir_cofre");
  if (error || !data) return { error: true };
  revalidatePath("/app", "layout");
  return data as ResultadoCofre;
}
