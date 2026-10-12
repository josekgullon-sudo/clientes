import { describe, expect, it } from "vitest";
import { pesoTema, predecir, probabilidadTema, type TemaPrediccion } from "./prediccion";

function tema(parcial: Partial<TemaPrediccion> & Pick<TemaPrediccion, "numero" | "bloque">): TemaPrediccion {
  return {
    titulo: `Tema ${parcial.numero}`,
    total: 10,
    vistas: 0,
    aciertos: 0,
    respuestas: 0,
    ...parcial,
  };
}

describe("prediccion de nota", () => {
  it("trata lo no visto como azar y suaviza con pocos datos", () => {
    const p = probabilidadTema({ total: 10, vistas: 0, aciertos: 0, respuestas: 0 });
    expect(p).toBeCloseTo(0.25, 5);
    const visto = probabilidadTema({ total: 10, vistas: 10, aciertos: 8, respuestas: 10 });
    expect(visto).toBeCloseTo(10 / 14, 5);
  });

  it("no da nota por debajo de 100 respuestas", () => {
    const r = predecir([tema({ numero: 1, bloque: "I", vistas: 10, aciertos: 8, respuestas: 10 })], 40);
    expect(r.suficiente).toBe(false);
    expect(r.parte1).toBeNull();
  });

  it("reescala el bloque I a 50 con la penalización de un tercio", () => {
    const temas = Array.from({ length: 16 }, (_, i) =>
      tema({ numero: i + 1, bloque: "I", vistas: 10, aciertos: 8, respuestas: 10 }),
    );
    const r = predecir(temas, 160);
    // P = 10/14; puntos = P − (1−P)/3·0,9; al ir todo el bloque igual, la nota es puntos·50.
    const p = 10 / 14;
    const puntos = p - (1 - p) * (1 / 3) * 0.9;
    expect(r.suficiente).toBe(true);
    expect(r.parte1?.nota).toBeCloseTo(Math.round(puntos * 50 * 10) / 10, 5);
    expect(r.parte2).toBeNull();
    expect(pesoTema("I")).toBeCloseTo(30 / 16);
    expect(pesoTema("II")).toBeCloseTo(50 / 12);
  });

  it("ordena las debilidades por la probabilidad más baja", () => {
    const r = predecir(
      [
        tema({ numero: 1, bloque: "I", vistas: 10, aciertos: 8, respuestas: 10 }),
        tema({ numero: 11, bloque: "I", vistas: 10, aciertos: 1, respuestas: 10 }),
      ],
      20,
    );
    expect(r.debilidades[0]?.numero).toBe(11);
  });
});
