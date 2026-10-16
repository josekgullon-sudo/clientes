import "server-only";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/servidor";
import {
  rellenarSerie,
  resumirCuentas,
  serieDias,
  type DatosPanel,
  type Fallo,
  type SuscripcionAdmin,
  type UsoLey,
  type UsuarioAdmin,
} from "./metricas";

async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const admin = supabaseAdmin();
  const todos: UsuarioAdmin[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    for (const u of data.users) {
      todos.push({ id: u.id, email: u.email ?? null, creado: u.created_at });
    }
    if (data.users.length < 200) break;
  }
  return todos;
}

async function marcasStripe(ids: string[]): Promise<Map<string, boolean> | null> {
  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave || ids.length === 0) return null;
  try {
    const stripe = new Stripe(clave);
    const mapa = new Map<string, boolean>();
    let cursor: string | undefined;
    for (let i = 0; i < 10; i++) {
      const pagina = await stripe.subscriptions.list({ status: "all", limit: 100, starting_after: cursor });
      for (const sub of pagina.data) mapa.set(sub.id, sub.cancel_at_period_end);
      if (!pagina.has_more) break;
      cursor = pagina.data.at(-1)?.id;
    }
    return mapa;
  } catch {
    return null;
  }
}

async function ingresosStripe(desde: Date): Promise<DatosPanel["stripe"]> {
  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave) return { disponible: false };
  try {
    const stripe = new Stripe(clave);
    let cents = 0;
    let cobros = 0;
    let cursor: string | undefined;
    const gte = Math.floor(desde.getTime() / 1000);
    for (let i = 0; i < 20; i++) {
      const pagina = await stripe.charges.list({ created: { gte }, limit: 100, starting_after: cursor });
      for (const c of pagina.data) {
        if (!c.paid) continue;
        const neto = c.amount - (c.amount_refunded ?? 0);
        if (neto <= 0) continue;
        cents += neto;
        cobros++;
      }
      if (!pagina.has_more) break;
      cursor = pagina.data.at(-1)?.id;
    }
    return { disponible: true, cents, cobros };
  } catch {
    return { disponible: false };
  }
}

function actividadVacia(dias: string[]): DatosPanel["actividad"] {
  return { disponible: false, tests: dias.map((dia) => ({ dia, total: 0 })), activos7d: 0, fallos: [], porLey: [] };
}

export async function cargarPanel(ahora = new Date()): Promise<DatosPanel> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("sin_servicio");
  }
  const admin = supabaseAdmin();
  const [usuarios, subsRes] = await Promise.all([
    listarUsuarios(),
    admin
      .from("suscripciones")
      .select("usuario_id, plan, estado, fin_periodo, stripe_subscription_id, actualizada_en"),
  ]);
  if (subsRes.error) throw new Error(subsRes.error.message);
  const suscripciones = (subsRes.data ?? []) as SuscripcionAdmin[];
  const cuentas = resumirCuentas(usuarios, suscripciones, ahora);
  const dias = serieDias(30, ahora);
  const marcas = await marcasStripe(cuentas.lista.map((s) => s.cancelaId).filter((id): id is string => !!id));

  const { data: resumen, error: errorResumen } = await admin.rpc("resumen_admin");
  let actividad = actividadVacia(dias);
  if (!errorResumen && resumen && typeof resumen === "object") {
    const bruto = resumen as {
      tests_por_dia?: { dia: string; total: number }[];
      activos_7d?: number;
      fallos?: Fallo[];
      por_ley?: UsoLey[];
    };
    actividad = {
      disponible: true,
      tests: rellenarSerie(dias, bruto.tests_por_dia ?? []),
      activos7d: bruto.activos_7d ?? 0,
      fallos: (bruto.fallos ?? []).slice(0, 10),
      porLey: [...(bruto.por_ley ?? [])].sort((a, b) => b.respuestas - a.respuestas),
    };
  }

  const desde = new Date(`${dias[0]}T00:00:00+02:00`);
  const embudoRes = await admin.rpc("admin_embudo", { p_desde: null, p_hasta: null, p_origen: null });
  const embudo = !embudoRes.error && Array.isArray(embudoRes.data) ? (embudoRes.data as { id: string; total: number }[]) : null;
  return {
    ...cuentas,
    suscripciones: cuentas.lista.map((s) => ({
      email: s.email,
      estado: s.estado,
      plan: s.plan,
      fin: s.fin,
      cancela: s.cancelaId && marcas?.has(s.cancelaId) ? marcas.get(s.cancelaId)! : null,
    })),
    stripe: await ingresosStripe(desde),
    actividad,
    embudo,
  };
}
