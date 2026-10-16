import type { PreguntaTest } from "./tipos";

export type TemaNivel = {
  temaId: string | null;
  numero: number | null;
  etiqueta: string;
  total: number;
  aciertos: number;
  porcentaje: number;
};

/** Porcentaje de aciertos de cada tema del test. Los perfectos también cuentan. */
export function porcentajesPorTema(preguntas: PreguntaTest[], respuestas: Map<string, number | null>): TemaNivel[] {
  const grupos = new Map<string, TemaNivel>();
  for (const pregunta of preguntas) {
    const clave = pregunta.tema ? `t${pregunta.tema.numero}` : (pregunta.ley ?? "otros");
    const actual = grupos.get(clave) ?? {
      temaId: pregunta.tema?.id ?? null,
      numero: pregunta.tema?.numero ?? null,
      etiqueta: pregunta.tema ? `Tema ${pregunta.tema.numero}. ${pregunta.tema.titulo}` : (pregunta.ley ?? "Otros"),
      total: 0,
      aciertos: 0,
      porcentaje: 0,
    };
    actual.total += 1;
    if (respuestas.get(pregunta.id) === pregunta.correcta) actual.aciertos += 1;
    if (!actual.temaId && pregunta.tema?.id) actual.temaId = pregunta.tema.id;
    actual.porcentaje = Math.round((actual.aciertos / actual.total) * 100);
    grupos.set(clave, actual);
  }
  return [...grupos.values()].sort(
    (a, b) => a.porcentaje - b.porcentaje || (a.numero ?? 999) - (b.numero ?? 999),
  );
}

/** El tema por el que conviene empezar: el de menor porcentaje, y a igualdad el de número más bajo. */
export function recomendarInicio(temas: TemaNivel[]): TemaNivel | null {
  const conTema = temas.filter((tema) => tema.temaId);
  return (conTema.length > 0 ? conTema : temas)[0] ?? null;
}
