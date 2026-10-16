import "server-only";
import { supabaseAdmin } from "@/lib/supabase/servidor";
import type { ConsultaPersonas, FichaPersona, FilaPersona, ListaPersonas, NotaFicha, SesionesFicha } from "./personas";

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
  if (!error) {
    const bruto = (data ?? {}) as { total?: number; filas?: ListaPersonas["filas"] };
    return {
      total: typeof bruto.total === "number" ? bruto.total : 0,
      filas: Array.isArray(bruto.filas) ? bruto.filas : [],
    };
  }
  console.error("admin_usuarios", error.message);
  return personasDesdeAuth(busqueda, offset, limite);
}

/** Listado directo de cuentas, de la más nueva a la más antigua, si falta la función del CRM. */
async function personasDesdeAuth(busqueda: string, offset: number, limite: number): Promise<ListaPersonas> {
  const admin = supabaseAdmin();
  const todos: { id: string; email: string | null; creado: string }[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    for (const u of data.users) todos.push({ id: u.id, email: u.email ?? null, creado: u.created_at });
    if (data.users.length < 200) break;
  }
  const q = busqueda.trim().toLowerCase();
  const filtrados = todos
    .filter((u) => !q || (u.email ?? "").toLowerCase().includes(q))
    .sort((a, b) => b.creado.localeCompare(a.creado));
  const pagina = filtrados.slice(offset, offset + limite);
  const ids = pagina.map((u) => u.id);
  const perfiles = new Map<string, { ultimo_acceso: string | null; racha_actual: number }>();
  const planes = new Map<string, { plan: string | null; estado: string | null }>();
  const tests = new Map<string, number>();
  if (ids.length > 0) {
    const [perfilRes, planRes, testRes] = await Promise.all([
      admin.from("perfil_estudio").select("usuario_id, ultimo_acceso, racha_actual").in("usuario_id", ids),
      admin.from("suscripciones").select("usuario_id, plan, estado").in("usuario_id", ids),
      admin.from("intentos").select("usuario_id").in("usuario_id", ids).eq("es_importado", false),
    ]);
    for (const p of perfilRes.data ?? []) perfiles.set(p.usuario_id, p);
    for (const p of planRes.data ?? []) planes.set(p.usuario_id, p);
    for (const t of testRes.data ?? []) tests.set(t.usuario_id, (tests.get(t.usuario_id) ?? 0) + 1);
  }
  return {
    total: filtrados.length,
    filas: pagina.map((u) => {
      const perfil = perfiles.get(u.id);
      const plan = planes.get(u.id);
      return {
        id: u.id,
        email: u.email,
        registro: u.creado,
        ultimo_acceso: perfil?.ultimo_acceso ?? null,
        tests: tests.get(u.id) ?? 0,
        plan: plan?.plan ?? null,
        estado: plan?.estado ?? null,
        racha: perfil?.racha_actual ?? 0,
        xp: 0,
        hizo_test: (tests.get(u.id) ?? 0) > 0,
        limite: false,
        precios: false,
        checkout: false,
        pago: plan?.estado === "active" || plan?.estado === "trialing" || plan?.estado === "past_due",
      };
    }),
  };
}

export async function cargarFicha(id: string): Promise<FichaPersona | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("admin_usuario", { p_uid: id });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") return null;
  return data as FichaPersona;
}

export async function cargarNotas(id: string): Promise<NotaFicha[]> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("notas_admin")
    .select("id, texto, creado_en")
    .eq("usuario_id", id)
    .order("creado_en", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as NotaFicha[];
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
