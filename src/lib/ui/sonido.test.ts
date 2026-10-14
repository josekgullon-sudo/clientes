import { describe, expect, it } from "vitest";
import { notasAcierto } from "./sonido";

describe("notasAcierto", () => {
  it("el primer acierto suena como siempre (mi5 y si5)", () => {
    const [a, b] = notasAcierto(1);
    expect(a).toBeCloseTo(659.25, 1);
    expect(b).toBeCloseTo(987.77, 0);
  });

  it("cada acierto seguido sube de tono", () => {
    for (let n = 1; n < 12; n++) expect(notasAcierto(n + 1)[0]).toBeGreaterThan(notasAcierto(n)[0]);
  });

  it("se queda en lo más agudo a partir del 12", () => {
    expect(notasAcierto(20)[0]).toBeCloseTo(notasAcierto(12)[0]);
  });

  it("remata con cuatro notas en 5, 10, 15…", () => {
    expect(notasAcierto(5)).toHaveLength(4);
    expect(notasAcierto(10)).toHaveLength(4);
    expect(notasAcierto(15)).toHaveLength(4);
    expect(notasAcierto(6)).toHaveLength(2);
  });
});
