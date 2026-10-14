import { PRECIOS } from "../sitio";

export type UsuarioAdmin = { id: string; email: string | null; creado: string };

export type SuscripcionAdmin = {
  usuario_id: string;
  plan: string | null;
  estado: string;
  fin_periodo: string | null;
  stripe_subscription_id: string | null;
  actualizada_en: string | null;
};

export type Punto = { dia: string; total: number };

export type Fallo = {
  id: string;
  fallos: number;
  respuestas: number;
  enunciado: string;
  articulo: string;
  ley: string;
};

export type UsoLey = { ley: string; respuestas: number; usuarios: number };

export type DatosPanel = {
  kpis: Kpis;
  altas: Punto[];
  recientes: { email: string; fecha: string; plan: string }[];
  suscripciones: {
    email: string;
    estado: string;
    plan: string;
    fin: string | null;
    cancela: boolean | null;
  }[];
  stripe: { disponible: false } | { disponible: true; cents: number; cobros: number };
  actividad: {
    disponible: boolean;
    tests: Punto[];
    activos7d: number;
    fallos: Fallo[];
    porLey: UsoLey[];
  };
};

export type Kpis = {
  usuarios: number;
  hoy: number;
  siete: number;
  treinta: number;
  premiumMensual: number;
  premiumAnual: number;
  gratis: number;
  conversion: number;
  mrrCents: number;
};

const ACTIVOS = new Set(["active", "trialing"]);

/** Día civil en Madrid, `YYYY-MM-DD`. */
export function diaMadrid(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

/** Los últimos `n` días, hoy incluido, en calendario de Madrid. */
export function serieDias(n: number, ahora: Date): string[] {
  const [y, m, d] = diaMadrid(ahora).split("-").map(Number);
  const dias: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dias.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return dias;
}

export function esPremium(s: SuscripcionAdmin, ahora: Date): boolean {
  if (!ACTIVOS.has(s.estado)) return false;
  if (!s.fin_periodo) return true;
  return new Date(s.fin_periodo).getTime() > ahora.getTime();
}

export function rellenarSerie(dias: string[], puntos: { dia: string; total: number }[]): Punto[] {
  const mapa = new Map(puntos.map((p) => [p.dia.slice(0, 10), p.total]));
  return dias.map((dia) => ({ dia, total: mapa.get(dia) ?? 0 }));
}

export function resumirCuentas(
  usuarios: UsuarioAdmin[],
  suscripciones: SuscripcionAdmin[],
  ahora: Date,
): {
  kpis: Kpis;
  altas: Punto[];
  recientes: { email: string; fecha: string; plan: string }[];
  lista: {
    email: string;
    estado: string;
    plan: string;
    fin: string | null;
    cancelaId: string | null;
  }[];
} {
  const dias30 = serieDias(30, ahora);
  const hoy = dias30.at(-1)!;
  const porId = new Map(usuarios.map((u) => [u.id, u]));
  const premiumDe = new Map<string, SuscripcionAdmin>();
  for (const s of suscripciones) {
    if (porId.has(s.usuario_id) && esPremium(s, ahora)) premiumDe.set(s.usuario_id, s);
  }

  let premiumMensual = 0;
  let premiumAnual = 0;
  for (const s of premiumDe.values()) {
    if (s.plan === "anual") premiumAnual++;
    else premiumMensual++;
  }
  const premium = premiumMensual + premiumAnual;
  const usuariosN = usuarios.length;
  const cuenta = new Map<string, number>();
  for (const u of usuarios) {
    const dia = diaMadrid(new Date(u.creado));
    cuenta.set(dia, (cuenta.get(dia) ?? 0) + 1);
  }
  const altas = dias30.map((dia) => ({ dia, total: cuenta.get(dia) ?? 0 }));

  const mrrCents =
    premiumMensual * Math.round(PRECIOS.mensual * 100) + premiumAnual * Math.round((PRECIOS.anual / 12) * 100);

  const recientes = [...usuarios]
    .sort((a, b) => b.creado.localeCompare(a.creado))
    .slice(0, 12)
    .map((u) => {
      const s = premiumDe.get(u.id);
      const plan = s?.plan === "anual" ? "Anual" : s?.plan === "mensual" ? "Mensual" : "Gratis";
      return { email: u.email ?? "—", fecha: u.creado, plan };
    });

  const lista = [...suscripciones]
    .sort((a, b) => (b.actualizada_en ?? "").localeCompare(a.actualizada_en ?? ""))
    .slice(0, 20)
    .map((s) => ({
      email: porId.get(s.usuario_id)?.email ?? "—",
      estado: s.estado,
      plan: s.plan === "anual" ? "Anual" : s.plan === "mensual" ? "Mensual" : "—",
      fin: s.fin_periodo,
      cancelaId: s.stripe_subscription_id,
    }));

  return {
    kpis: {
      usuarios: usuariosN,
      hoy: cuenta.get(hoy) ?? 0,
      siete: dias30.slice(-7).reduce((n, dia) => n + (cuenta.get(dia) ?? 0), 0),
      treinta: altas.reduce((n, p) => n + p.total, 0),
      premiumMensual,
      premiumAnual,
      gratis: Math.max(0, usuariosN - premium),
      conversion: usuariosN === 0 ? 0 : Math.round((premium / usuariosN) * 1000) / 10,
      mrrCents,
    },
    altas,
    recientes,
    lista,
  };
}
