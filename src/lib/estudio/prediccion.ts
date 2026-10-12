/**
 * Predicción de nota (MVP, sin ML). La misma fórmula está en
 * `prediccion_nota()` de la migración de estadísticas.
 *
 * P(acierto) = p·c + 0,25·(1−c)
 * p = (aciertos+2)/(respuestas+4) sobre las últimas 50 del tema
 * c = vistas/total
 * Puntos por pregunta ≈ P − (1−P)·(1/3)·0,9
 * Se reescala cada parte a 0-50.
 */

export type TemaPrediccion = {
  numero: number;
  titulo: string;
  bloque: string;
  total: number;
  vistas: number;
  /** Aciertos en las últimas 50 respuestas del tema. */
  aciertos: number;
  /** Respuestas tenidas en cuenta (máximo 50). */
  respuestas: number;
};

export type NotaParte = { nota: number; bajo: number; alto: number };

export type Prediccion = {
  suficiente: boolean;
  respuestas: number;
  parte1: NotaParte | null;
  parte2: NotaParte | null;
  debilidades: { numero: number; titulo: string; bloque: string; probabilidad: number; peso: number }[];
};

const TASA = 0.9;
const PENALIZACION = 1 / 3;

export function pesoTema(bloque: string): number {
  return bloque === "II" ? 50 / 12 : 30 / 16;
}

export function probabilidadTema(t: Pick<TemaPrediccion, "total" | "vistas" | "aciertos" | "respuestas">): number {
  const p = (t.aciertos + 2) / (t.respuestas + 4);
  const c = t.total > 0 ? Math.min(1, t.vistas / t.total) : 0;
  return p * c + 0.25 * (1 - c);
}

function puntosPorPregunta(p: number): number {
  return p - (1 - p) * PENALIZACION * TASA;
}

function notaParte(temas: TemaPrediccion[], bloque: string, mitad: number): NotaParte | null {
  const delBloque = temas.filter((t) => t.bloque === bloque);
  if (delBloque.length === 0) return null;
  const pesoTotal = delBloque.reduce((s, t) => s + pesoTema(t.bloque), 0);
  const raw = delBloque.reduce((s, t) => s + pesoTema(t.bloque) * puntosPorPregunta(probabilidadTema(t)), 0);
  const nota = pesoTotal > 0 ? Math.min(50, Math.max(0, (raw / pesoTotal) * 50)) : 0;
  const redondeada = Math.round(nota * 10) / 10;
  const bajo = Math.round(Math.max(0, redondeada - mitad) * 10) / 10;
  const alto = Math.round(Math.min(50, redondeada + mitad) * 10) / 10;
  return { nota: redondeada, bajo, alto };
}

export function predecir(temas: TemaPrediccion[], respuestasTotales: number): Prediccion {
  const mitad = Math.max(1.5, 6 * (1 - Math.min(respuestasTotales, 400) / 400));
  const debilidades = temas
    .filter((t) => t.total > 0)
    .map((t) => ({
      numero: t.numero,
      titulo: t.titulo,
      bloque: t.bloque,
      probabilidad: probabilidadTema(t),
      peso: pesoTema(t.bloque),
    }))
    .sort((a, b) => a.probabilidad - b.probabilidad || b.peso - a.peso)
    .slice(0, 3);

  if (respuestasTotales < 100) {
    return { suficiente: false, respuestas: respuestasTotales, parte1: null, parte2: null, debilidades };
  }

  return {
    suficiente: true,
    respuestas: respuestasTotales,
    parte1: notaParte(temas, "I", mitad),
    parte2: notaParte(temas, "II", mitad),
    debilidades,
  };
}
