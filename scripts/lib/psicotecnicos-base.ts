/**
 * Herramientas comunes para generar psicotécnicos: números pseudoaleatorios con semilla (el
 * resultado es siempre el mismo), formato de cifras en español y montaje de las opciones.
 */

export type Dificultad = 1 | 2 | 3;

/** Pregunta antes de colocar las opciones: la correcta y tres distractores. */
export type Borrador = {
  tipo: string;
  tema: number;
  articulo: string;
  enunciado: string;
  correcta: string;
  otras: string[];
  explicacion: string;
  dificultad: Dificultad;
};

export function crearAzar(semilla: number) {
  let a = semilla >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
  const pick = <T>(lista: readonly T[]): T => lista[Math.floor(rnd() * lista.length)];
  const shuffle = <T>(lista: readonly T[]): T[] => {
    const c = [...lista];
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
  };
  return { rnd, int, pick, shuffle };
}

const formato = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, useGrouping: false });
/** 1234,5 → «1234,5». Sin separador de miles por debajo de 10 000, como pide la RAE. */
export function cifra(n: number): string {
  const redondeado = Math.round(n * 100) / 100;
  if (Math.abs(redondeado) >= 10000) {
    const [entera, dec] = formato.format(redondeado).split(",");
    const con = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return dec ? `${con},${dec}` : con;
  }
  return formato.format(redondeado);
}

export const euros = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return `${Number.isInteger(r) ? cifra(r) : r.toFixed(2).replace(".", ",")} €`;
};

/** Tres distractores numéricos distintos de la correcta, empezando por los que se pidan. */
export function distractoresNumericos(
  correcta: number,
  pistas: number[],
  { minimo = -Infinity, maximo = Infinity, entero = true }: { minimo?: number; maximo?: number; entero?: boolean } = {},
): number[] {
  const vistos = new Set<number>([correcta]);
  const salida: number[] = [];
  const probar = (n: number) => {
    const v = Math.round(n * 100) / 100;
    if (!Number.isFinite(v) || v < minimo || v > maximo || (entero && !Number.isInteger(v)) || vistos.has(v)) return;
    vistos.add(v);
    salida.push(v);
  };
  for (const p of pistas) probar(p);
  for (const d of [1, -1, 2, -2, 3, -3, 5, -5, 10, -10, 4, -4, 6, -6, 7, -7]) {
    if (salida.length >= 3) break;
    probar(correcta + d);
  }
  return salida.slice(0, 3);
}

export const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export const LETRAS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

/** Letra de control del DNI: resto de dividir entre 23. */
export const LETRAS_DNI = "TRWAGMYFPDXBNJZSQVHLCKE";

export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;
export const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;
