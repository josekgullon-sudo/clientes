import "server-only";
import { supabaseAdmin } from "@/lib/supabase/servidor";
import type { ConsultaPersonas, FichaPersona, FilaPersona, ListaPersonas, SesionesFicha } from "./personas";

export async function cargarPersonas(
  filtro: string,
  busqueda: string,
  orden: string,
  offset: number,
  limite = 40,
): Promise<ListaPersonas> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("admin_usuarios", {
    p_filtro: filtro,
    p_busqueda: busqueda,
    p_orden: orden,
    p_limite: limite,
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

export async function cargarSesiones(id: string): Promise<SesionesFicha | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("admin_sesiones", { p_uid: id });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") return null;
  const bruto = data as SesionesFicha;
  return {
    total: typeof bruto.total === "number" ? bruto.total : 0,
    segundos: typeof bruto.segundos === "number" ? bruto.segundos : 0,
    recientes: Array.isArray(bruto.recientes) ? bruto.recientes : [],
  };
}

const TOPE_EXPORTACION = 2000;

/** Recorre el listado de 100 en 100. No incluye respuestas ni datos de pago. */
export async function listarParaExportar(consulta: ConsultaPersonas): Promise<FilaPersona[]> {
  const filas: FilaPersona[] = [];
  for (let offset = 0; offset < TOPE_EXPORTACION; offset += 100) {
    const pagina = await cargarPersonas(consulta.filtro, consulta.busqueda, consulta.orden, offset, 100);
    filas.push(...pagina.filas);
    if (pagina.filas.length < 100 || filas.length >= pagina.total) break;
  }
  return filas.slice(0, TOPE_EXPORTACION);
}
