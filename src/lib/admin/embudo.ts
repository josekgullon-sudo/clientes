const MADRID = "Europe/Madrid";

export const PASOS_EMBUDO = [
  { id: "registro", texto: "Registros" },
  { id: "test_inicio", texto: "Empezaron un test" },
  { id: "limite_gratis", texto: "Llegaron al límite" },
  { id: "vista_precios", texto: "Vieron precios" },
  { id: "checkout_inicio", texto: "Abrieron el pago" },
  { id: "pago_ok", texto: "Pagaron" },
] as const;

export type PasoEmbudo = { id: string; total: number };

export function porcentaje(parte: number, base: number): number | null {
  if (!Number.isFinite(parte) || !Number.isFinite(base) || base <= 0) return null;
  return Math.round((parte / base) * 100);
}

function relojMadrid(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: MADRID,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha);
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  const hora = mapa.hour === "24" ? "00" : mapa.hour;
  return { dia: `${mapa.year}-${mapa.month}-${mapa.day}`, hora, minuto: mapa.minute };
}

/** Medianoche de ese día en Madrid, en ISO. Null si la fecha no existe. */
export function inicioDiaMadrid(ymd: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  for (let horaUtc = -2; horaUtc <= 4; horaUtc++) {
    const fecha = new Date(Date.UTC(y, m - 1, d, horaUtc, 0, 0));
    const reloj = relojMadrid(fecha);
    if (reloj.dia === ymd && reloj.hora === "00" && reloj.minuto === "00") return fecha.toISOString();
  }
  return null;
}

export function diaSiguiente(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

export function leerRango(desde: string, hasta: string): { ok: true; desde: string | null; hasta: string | null } | { ok: false } {
  if (desde && !inicioDiaMadrid(desde)) return { ok: false };
  if (hasta && !inicioDiaMadrid(hasta)) return { ok: false };
  if (desde && hasta && desde > hasta) return { ok: false };
  return {
    ok: true,
    desde: desde ? inicioDiaMadrid(desde) : null,
    hasta: hasta ? inicioDiaMadrid(diaSiguiente(hasta)) : null,
  };
}

/** `gclid` o un utm_source corto. Vacío significa todos. */
export function origenConsulta(valor: string): string | null {
  const v = valor.trim();
  if (!v || v === "todos") return null;
  if (v === "gclid") return "gclid";
  if (/^[A-Za-z0-9._-]{1,80}$/.test(v)) return v;
  return null;
}

export function celdaCsv(valor: unknown): string {
  let s = valor == null ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const CABECERA = ["correo", "registro", "ultimo_acceso", "tests", "plan", "estado", "racha", "xp", "hizo_test", "limite", "precios", "checkout", "pago"];

export function csvPersonas(
  filas: {
    email: string | null;
    registro: string;
    ultimo_acceso: string | null;
    tests: number;
    plan: string | null;
    estado: string | null;
    racha: number;
    xp: number;
    hizo_test: boolean;
    limite: boolean;
    precios: boolean;
    checkout: boolean;
    pago: boolean;
  }[],
): string {
  const lineas = filas.map((f) =>
    [
      f.email ?? "",
      f.registro,
      f.ultimo_acceso ?? "",
      f.tests,
      f.plan ?? "",
      f.estado ?? "",
      f.racha,
      f.xp,
      f.hizo_test ? "si" : "no",
      f.limite ? "si" : "no",
      f.precios ? "si" : "no",
      f.checkout ? "si" : "no",
      f.pago ? "si" : "no",
    ]
      .map(celdaCsv)
      .join(","),
  );
  return `\uFEFF${[CABECERA.join(","), ...lineas].join("\r\n")}`;
}
