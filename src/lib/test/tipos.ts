/** Pregunta tal como la usa la pantalla de test y la corrección. */
export type PreguntaTest = {
  id: string;
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
  articulo: string;
  ley: string | null; // nombre corto: "Ley 39/2015"
  tema: { numero: number; titulo: string } | null;
};

/** null = en blanco */
export type Respuesta = { preguntaId: string; respuesta: number | null; tiempoMs: number };

export type ModoSesion = "estudio" | "examen";

export const LETRAS = ["A", "B", "C", "D"] as const;

export type Resultado = {
  total: number;
  aciertos: number;
  fallos: number;
  enBlanco: number;
  /** Nota sobre 10 aplicando la penalización. */
  nota: number;
};

export function calcularResultado(
  preguntas: PreguntaTest[],
  respuestas: Map<string, number | null>,
  penalizacion: number,
): Resultado {
  let aciertos = 0;
  let fallos = 0;
  for (const p of preguntas) {
    const r = respuestas.get(p.id);
    if (r === undefined || r === null) continue;
    if (r === p.correcta) aciertos++;
    else fallos++;
  }
  const total = preguntas.length;
  const nota = total ? Math.max(0, aciertos - fallos * penalizacion) * (10 / total) : 0;
  return { total, aciertos, fallos, enBlanco: total - aciertos - fallos, nota: Math.round(nota * 100) / 100 };
}

/** Agrupa fallos y blancos por tema (o por ley si no hay tema) para sugerir qué repasar. */
export function temasAMejorar(preguntas: PreguntaTest[], respuestas: Map<string, number | null>) {
  const grupos = new Map<string, { etiqueta: string; total: number; aciertos: number }>();
  for (const p of preguntas) {
    const clave = p.tema ? `t${p.tema.numero}` : (p.ley ?? "otros");
    const etiqueta = p.tema ? `Tema ${p.tema.numero}. ${p.tema.titulo}` : (p.ley ?? "Otros");
    const g = grupos.get(clave) ?? { etiqueta, total: 0, aciertos: 0 };
    g.total++;
    if (respuestas.get(p.id) === p.correcta) g.aciertos++;
    grupos.set(clave, g);
  }
  return [...grupos.values()]
    .filter((g) => g.aciertos < g.total)
    .sort((a, b) => a.aciertos / a.total - b.aciertos / b.total);
}
