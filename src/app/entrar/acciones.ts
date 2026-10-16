"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { alEntrar, fijarOrigenAlta } from "@/lib/crm/eventos";
import { supabaseServidor } from "@/lib/supabase/servidor";

export type EstadoEntrar = { enviado?: string; error?: string };
export type EstadoCodigo = { email?: string; error?: string };

/** Solo rutas internas, para no redirigir fuera de la web. */
function rutaSegura(siguiente: FormDataEntryValue | null) {
  const s = typeof siguiente === "string" ? siguiente : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/app";
}

async function origen() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function enviarEnlace(_: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const email = String(datos.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Revisa el correo: parece que falta algo." };
  }
  const siguiente = rutaSegura(datos.get("siguiente"));
  await fijarOrigenAlta(datos.get("origen"));
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${await origen()}/auth/callback?siguiente=${encodeURIComponent(siguiente)}`,
    },
  });
  if (error) {
    return {
      error:
        error.status === 429
          ? "Has pedido varios enlaces seguidos. Espera un minuto y vuelve a probar."
          : "No hemos podido enviar el enlace. Prueba de nuevo en un momento.",
    };
  }
  return { enviado: email };
}

export async function verificarCodigo(_: EstadoCodigo, datos: FormData): Promise<EstadoCodigo> {
  const email = String(datos.get("email") ?? "").trim();
  const token = String(datos.get("codigo") ?? "").replace(/\s/g, "");
  const siguiente = rutaSegura(datos.get("siguiente"));
  // Supabase envía 6 u 8 cifras según la configuración del proyecto.
  if (!/^\d{6,10}$/.test(token)) {
    return { email, error: "Escribe el código que te hemos enviado, solo los números." };
  }
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return { email, error: "Ese código no es válido o ha caducado. Pide otro correo." };
  }
  await fijarOrigenAlta(datos.get("origen"));
  await alEntrar();
  redirect(siguiente);
}

export async function entrarConGoogle(datos: FormData) {
  const siguiente = rutaSegura(datos.get("siguiente"));
  await fijarOrigenAlta(datos.get("origen"));
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origen()}/auth/callback?siguiente=${encodeURIComponent(siguiente)}` },
  });
  if (error || !data.url) redirect("/entrar?error=google");
  redirect(data.url);
}
