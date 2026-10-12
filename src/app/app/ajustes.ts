"use server";

import { redirect } from "next/navigation";
import { OPOSICION } from "@/lib/sitio";
import { supabaseServidor } from "@/lib/supabase/servidor";

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
  const { error } = await supabase.rpc("guardar_perfil", {
    p_objetivo: objetivoValido(datos.get("objetivo")),
    p_fecha: fechaValida(datos.get("fecha")),
    p_recordatorio: datos.get("recordatorio") === "1",
    p_completar: datos.get("completar") === "1",
  });
  const volver = String(datos.get("volver") ?? "");
  const destino = volver.startsWith("/app") && !volver.startsWith("//") ? volver : "/app";
  if (error) redirect(`${destino}${destino.includes("?") ? "&" : "?"}error=ajustes`);

  if (datos.get("empezar") === "1") {
    const tema = String(datos.get("tema") ?? "");
    if (/^[0-9a-f-]{36}$/.test(tema)) {
      const { data, error: test } = await supabase.rpc("crear_intento", {
        p_oposicion: OPOSICION,
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
