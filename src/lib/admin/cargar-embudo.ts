import "server-only";
import { supabaseAdmin } from "@/lib/supabase/servidor";
import type { PasoEmbudo } from "./embudo";

export async function cargarEmbudo(desde: string | null, hasta: string | null, origen: string | null): Promise<PasoEmbudo[]> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("admin_embudo", { p_desde: desde, p_hasta: hasta, p_origen: origen });
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) return [];
  return data.filter((p): p is PasoEmbudo => !!p && typeof p.id === "string" && typeof p.total === "number");
}

export async function cargarFuentes(): Promise<string[]> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("admin_origenes");
  if (error || !Array.isArray(data)) return [];
  return data.filter((f): f is string => typeof f === "string" && f.length > 0 && f.length <= 80);
}
