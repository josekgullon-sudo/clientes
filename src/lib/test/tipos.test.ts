import { describe, expect, it } from "vitest";
import { calcularResultado, temasAMejorar, type PreguntaTest } from "./tipos";

const p = (id: string, correcta: number, tema = 1): PreguntaTest => ({
  id,
  enunciado: "¿?",
  opciones: ["a", "b", "c", "d"],
  correcta,
  explicacion: "",
  articulo: "1",
  ley: "Ley 39/2015",
  tema: { numero: tema, titulo: `Tema ${tema}` },
});

describe("calcularResultado", () => {
  const preguntas = [p("1", 0), p("2", 1), p("3", 2), p("4", 3)];

  it("cuenta aciertos, fallos y blancos", () => {
    const r = calcularResultado(preguntas, new Map([["1", 0], ["2", 0], ["3", null]]), 0);
    expect(r).toMatchObject({ total: 4, aciertos: 1, fallos: 1, enBlanco: 2 });
    expect(r.nota).toBe(2.5);
  });

  it("aplica la penalización de un tercio por fallo", () => {
    const r = calcularResultado(preguntas, new Map([["1", 0], ["2", 1], ["3", 0], ["4", 0]]), 1 / 3);
    // (2 - 2/3) * 10 / 4
    expect(r.nota).toBeCloseTo(3.33, 2);
  });

  it("no baja de cero", () => {
    const r = calcularResultado(preguntas, new Map([["1", 1], ["2", 0]]), 1);
    expect(r.nota).toBe(0);
  });
});

describe("temasAMejorar", () => {
  it("ordena de peor a mejor y omite los temas perfectos", () => {
    const preguntas = [p("1", 0, 1), p("2", 0, 1), p("3", 0, 2), p("4", 0, 3)];
    const t = temasAMejorar(preguntas, new Map([["1", 0], ["2", 1], ["3", 1], ["4", 0]]));
    expect(t.map((x) => x.etiqueta)).toEqual(["Tema 2. Tema 2", "Tema 1. Tema 1"]);
  });
});
