import { describe, expect, it } from "vitest";
import { siguienteBloqueado, siguienteLeccion, type NodoCamino } from "./camino";
import { frasesCelebracion, hayCelebracion } from "./celebracion";
import { calcularXp, dominada, revisar } from "./repaso";

const nodo = (parcial: Partial<NodoCamino> & Pick<NodoCamino, "numero">): NodoCamino => ({
  tema_id: String(parcial.numero),
  titulo: `Tema ${parcial.numero}`,
  bloque: "I",
  total: 10,
  nivel: 0,
  lecciones: 0,
  corona: null,
  ...parcial,
});

describe("repaso espaciado", () => {
  it("al fallar vuelve a 1 día y baja la facilidad", () => {
    const r = revisar({ intervalo: 7, facilidad: 2.5, repeticiones: 2 }, false);
    expect(r).toMatchObject({ intervalo: 1, repeticiones: 0, facilidad: 2.3 });
  });

  it("al acertar usa 1, 3, 7, 16 y 35 ajustados por la facilidad", () => {
    let t = { intervalo: 0, facilidad: 2.5, repeticiones: 0 };
    const intervalos = [1, 3, 8, 18, 41];
    for (const esperado of intervalos) {
      t = revisar(t, true);
      expect(t.intervalo).toBe(esperado);
    }
    expect(t.facilidad).toBe(3);
    expect(dominada(16)).toBe(false);
    expect(dominada(21)).toBe(true);
  });
});

describe("xp", () => {
  it("premia el acierto, el esfuerzo y el repaso", () => {
    expect(calcularXp({ aciertos: 8, fallos: 2, modo: "leccion", total: 10, nivelSubido: false })).toBe(84);
    expect(calcularXp({ aciertos: 10, fallos: 0, modo: "leccion", total: 10, nivelSubido: true })).toBe(170);
    expect(calcularXp({ aciertos: 4, fallos: 6, modo: "repaso", total: 10, nivelSubido: false })).toBe(Math.round((40 + 12) * 1.5));
    expect(calcularXp({ aciertos: 40, fallos: 10, modo: "simulacro", total: 50, nivelSubido: false })).toBe(40 * 10 + 10 * 2 + 150);
  });
});

describe("camino", () => {
  const temas = [nodo({ numero: 1, nivel: 3 }), nodo({ numero: 3, nivel: 1 })];

  it("en gratis se queda en los niveles 1 y 2", () => {
    expect(siguienteLeccion(temas, false)?.numero).toBe(3);
  });

  it("en premium sigue por el primer tema sin corona", () => {
    expect(siguienteLeccion(temas, true)?.numero).toBe(1);
  });

  it("señala el primer nivel de pago cuando el gratis está agotado", () => {
    const hechos = [nodo({ numero: 1, nivel: 2, lecciones: 3, corona: null }), nodo({ numero: 2, total: 0 })];
    hechos[0] = nodo({ numero: 1, nivel: 3, lecciones: 0 });
    expect(siguienteLeccion([hechos[0]], false)).toBeNull();
    expect(siguienteBloqueado([hechos[0]], false)?.numero).toBe(1);
  });
});

describe("celebración", () => {
  it("festeja el objetivo, la corona y los hitos de racha", () => {
    const meta = { recien_cumplido: true, corona: "oro", racha_nueva: true, racha: 7, xp: 80 };
    expect(hayCelebracion(meta)).toBe(true);
    expect(frasesCelebracion(meta).length).toBe(3);
    expect(hayCelebracion({ xp: 12 })).toBe(false);
  });
});
