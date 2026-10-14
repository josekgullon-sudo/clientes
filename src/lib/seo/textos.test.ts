import { describe, expect, it } from "vitest";
import { deNorma, h1Ley, introLey, palabras } from "./textos";

const largo = {
  nombre:
    "Real Decreto Legislativo 5/2015, de 30 de octubre, por el que se aprueba el texto refundido de la Ley del Estatuto Básico del Empleado Público",
  nombreCorto: "TREBEP",
  fecha: "2025-07-31",
  total: 70,
  enPagina: 10,
  articulos: [{ articulo: "8" }, { articulo: "14" }, { articulo: "48" }],
  temas: [
    { numero: 11, titulo: "El personal al servicio de las Administraciones públicas", bloque: "I" },
    { numero: 12, titulo: "Derechos y deberes", bloque: "I" },
  ],
};

const minimo = {
  nombre: "Constitución Española de 1978",
  nombreCorto: "Constitución",
  fecha: "2026-05-20",
  total: 208,
  enPagina: 10,
  articulos: [{ articulo: "1.1" }],
  temas: [{ numero: 1, titulo: "La Constitución", bloque: "I" }],
};

const corto = {
  nombre: "Tratado de la Unión Europea (versión consolidada, DOUE C 202 de 7.6.2016)",
  nombreCorto: "TUE",
  fecha: null as string | null,
  total: 7,
  enPagina: 7,
  articulos: [] as { articulo: string }[],
  temas: [] as { numero: number; titulo: string; bloque: string }[],
};

describe("introducción de las páginas por ley", () => {
  it("usa el H1 pedido y el artículo correcto", () => {
    expect(h1Ley("Ley 39/2015")).toBe("Test Ley 39/2015 gratis (Auxiliar Administrativo)");
    expect(deNorma("Ley 39/2015")).toBe("de la Ley 39/2015");
    expect(deNorma("TREBEP")).toBe("del TREBEP");
    expect(deNorma("Real Decreto 208/1996, de 9 de febrero")).toBe("del Real Decreto 208/1996, de 9 de febrero");
  });

  it("se queda entre 150 y 250 palabras", () => {
    for (const input of [largo, corto, minimo]) {
      const n = palabras(introLey(input));
      expect(n).toBeGreaterThanOrEqual(150);
      expect(n).toBeLessThanOrEqual(250);
    }
  });
});
