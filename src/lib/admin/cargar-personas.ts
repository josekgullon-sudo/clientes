import "server-only";
import { supabaseAdmin } from "@/lib/supabase/servidor";
import type { FichaPersona, ListaPersonas } from "./personas";

export async function cargarPersonas(filtro: string, busqueda: string, orden: string, offset: number): Promise<ListaPersonas> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("admin_usuarios", {
    p_filtro: filtro,
    p_busqueda: busqueda,
    p_orden: orden,
    p_limite: 40,
    p_offset: offset,
  });
  if (error) throw new Error(error.message);
  const bruto = (data ?? {}) as { total?: number; filas?: ListaPersonas["filas"] };
  return {
    total: typeof bruto.total === "number" ? bruto.total : 0,
    filas: Array.isArray(bruto.filas) ? bruto.filas : [],
  };
}

export async function cargarFicha(id: string): Promise<FichaPersona | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("admin_usuario", { p_uid: id });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") return null;
  return data as FichaPersona;
}
