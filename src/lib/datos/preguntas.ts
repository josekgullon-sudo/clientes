import "server-only";
import type { PreguntaTest } from "@/lib/test/tipos";

/** Columnas de `preguntas` con su ley y su tema, para usar en `.select()`. */
export const SELECT_PREGUNTA =
  "id, enunciado, opciones, correcta, explicacion, articulo, leyes(nombre_corto), preguntas_oposiciones(temas(numero, titulo))";

type FilaPregunta = {
  id: string;
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
  articulo: string;
  leyes: { nombre_corto: string } | null;
  preguntas_oposiciones: { temas: { numero: number; titulo: string } | null }[];
};

export function aPreguntaTest(f: FilaPregunta): PreguntaTest {
  return {
    id: f.id,
    enunciado: f.enunciado,
    opciones: f.opciones,
    correcta: f.correcta,
    explicacion: f.explicacion,
    articulo: f.articulo,
    ley: f.leyes?.nombre_corto ?? null,
    tema: f.preguntas_oposiciones[0]?.temas ?? null,
  };
}

/** Ordena filas según una lista de ids (las consultas `in` no respetan el orden). */
export function ordenarPorIds(filas: FilaPregunta[], ids: string[]): PreguntaTest[] {
  const porId = new Map(filas.map((f) => [f.id, aPreguntaTest(f)]));
  return ids.map((id) => porId.get(id)).filter((p): p is PreguntaTest => !!p);
}

export type { FilaPregunta };
