import "server-only";
import { cookies } from "next/headers";
import { supabaseAdmin, supabaseServidor } from "@/lib/supabase/servidor";
import { COOKIE_ORIGEN, COOKIE_ORIGEN_ALTA, limpiarOrigen, type Origen } from "./origen";

export const TIPOS_EVENTO = [
  "registro",
  "onboarding_fin",
  "test_inicio",
  "test_fin",
  "limite_gratis",
  "vista_precios",
  "checkout_inicio",
  "pago_ok",
  "pago_fallido",
  "cancelacion",
] as const;

export type TipoEvento = (typeof TIPOS_EVENTO)[number];

type Meta = Record<string, string>;

const CLAVES_META = new Set(["modo", "intento", "motivo", "plan", "metodo"]);

export function metaEvento(bruto: unknown): Meta {
  if (!bruto || typeof bruto !== "object") return {};
  const meta: Meta = {};
  for (const [clave, valor] of Object.entries(bruto as Record<string, unknown>)) {
    if (!CLAVES_META.has(clave) || typeof valor !== "string") continue;
    const limpio = valor.replace(/[\n\r]/g, "").trim().slice(0, 80);
    if (limpio) meta[clave] = limpio;
  }
  return meta;
}

/** Anota un hecho de la persona con sesión. Si la migración no está aplicada, no interrumpe. */
export async function registrarEvento(tipo: TipoEvento, meta: Meta = {}) {
  try {
    const supabase = await supabaseServidor();
    const { error } = await supabase.rpc("registrar_evento", { p_tipo: tipo, p_meta: meta });
    if (error) console.error("evento", tipo, error.message);
  } catch (error) {
    console.error("evento", tipo, error instanceof Error ? error.message : "error");
  }
}

/** Hecho de pago o cancelación. Lo escribe el service role, sin datos de la tarjeta. */
export async function registrarEventoAdmin(usuarioId: string, tipo: TipoEvento, meta: Meta = {}) {
  try {
    const admin = supabaseAdmin();
    if (tipo === "cancelacion" || tipo === "pago_fallido") {
      const desde = new Date(Date.now() - (tipo === "cancelacion" ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000)).toISOString();
      const { data } = await admin
        .from("eventos")
        .select("id")
        .eq("usuario_id", usuarioId)
        .eq("tipo", tipo)
        .gte("creado_en", desde)
        .limit(1);
      if (data && data.length > 0) return;
    }
    const { error } = await admin.from("eventos").insert({ usuario_id: usuarioId, tipo, meta: metaEvento(meta) });
    if (error) console.error("evento", tipo, error.message);
  } catch (error) {
    console.error("evento", tipo, error instanceof Error ? error.message : "error");
  }
}

/** Actualiza la última visita, como mucho cada 10 minutos. */
export async function tocarAcceso() {
  try {
    const supabase = await supabaseServidor();
    await supabase.rpc("tocar_acceso");
  } catch {
    /* sin sesión o sin la migración */
  }
}

/** Guarda el origen de la primera visita en el alta. No pisa uno que ya exista. */
export async function guardarOrigenAlta() {
  try {
    const origen = await origenDeCookies();
    if (!origen) return;
    const supabase = await supabaseServidor();
    await supabase.rpc("guardar_origen", { p_origen: origen });
  } catch (error) {
    console.error("origen", error instanceof Error ? error.message : "error");
  }
}

/**
 * Primera entrada con esta cuenta: si aún no hay perfil, es un registro.
 * Quien ya estudiaba no recibe un registro nuevo.
 */
export async function alEntrar() {
  try {
    const supabase = await supabaseServidor();
    const { data: perfil, error } = await supabase.from("perfil_estudio").select("usuario_id").maybeSingle();
    if (error) return;
    if (!perfil) {
      await registrarEvento("registro");
      await guardarOrigenAlta();
      const { intentarBienvenida } = await import("@/lib/email/enviar");
      await intentarBienvenida();
    }
    await tocarAcceso();
  } catch (error) {
    console.error("al entrar", error instanceof Error ? error.message : "error");
  }
}

/** Lleva el UTM del formulario hasta el enlace del correo, sin guardarlo antes si no hay consentimiento. */
export async function fijarOrigenAlta(bruto: FormDataEntryValue | null) {
  const origen = limpiarOrigen(parsear(bruto), true);
  if (!origen) return;
  try {
    const almacen = await cookies();
    if (almacen.get(COOKIE_ORIGEN_ALTA)) return;
    almacen.set(COOKIE_ORIGEN_ALTA, JSON.stringify(origen), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    /* el alta sigue sin el origen */
  }
}

async function origenDeCookies(): Promise<Origen | null> {
  const almacen = await cookies();
  const primero = parsear(almacen.get(COOKIE_ORIGEN)?.value);
  const alta = parsear(almacen.get(COOKIE_ORIGEN_ALTA)?.value);
  return limpiarOrigen(primero, true) ?? limpiarOrigen(alta, true);
}

function parsear(bruto: FormDataEntryValue | string | null | undefined) {
  if (typeof bruto !== "string" || !bruto) return null;
  try {
    return JSON.parse(bruto);
  } catch {
    return null;
  }
}
