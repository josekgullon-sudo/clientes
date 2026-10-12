/** Utilidades puras de las páginas públicas: slug, semana y rotación. */

export function hoyMadrid(fecha = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

/** Semana ISO en horario de Madrid, para rotar las preguntas públicas. */
export function semanaISO(fecha = new Date()): string {
  const [y, m, d] = hoyMadrid(fecha).split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dia = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dia);
  const inicio = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((utc.getTime() - inicio.getTime()) / 86_400_000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}

export function diasEntre(desdeISO: string, hastaISO: string): number {
  const a = Date.parse(`${desdeISO}T00:00:00Z`);
  const b = Date.parse(`${hastaISO}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function slugTema(numero: number, titulo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56)
    .replace(/-+$/g, "");
  return `tema-${numero}-${base}`;
}

function aleatorio(semilla: string) {
  let x = 2166136261;
  for (let i = 0; i < semilla.length; i++) {
    x ^= semilla.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return () => {
    x |= 0;
    x = (x + 0x6d2b79f5) | 0;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mezclar<T>(items: readonly T[], semilla: string): T[] {
  const copia = [...items];
  const rand = aleatorio(semilla);
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** 10 preguntas distintas cada semana. Si hay menos, devuelve todas, en orden estable. */
export function elegirSemana<T>(items: readonly T[], clave: string, fecha: Date, n = 10): T[] {
  if (items.length <= n) return [...items];
  return mezclar(items, `${clave}:${semanaISO(fecha)}`).slice(0, n);
}

export type RutaPublica = { slug: string; tipo: "ley" | "tema"; numero?: number };

export function construirRutas(input: {
  leyes: { slug: string }[];
  temas: { numero: number; titulo: string }[];
}): RutaPublica[] {
  return [
    ...input.leyes.map((l) => ({ slug: l.slug, tipo: "ley" as const })),
    ...input.temas.map((t) => ({ slug: slugTema(t.numero, t.titulo), tipo: "tema" as const, numero: t.numero })),
  ];
}
