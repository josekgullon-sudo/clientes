import { describe, expect, it } from "vitest";
import { PRECIOS, TITULAR, TITULAR_INCOMPLETO, precioMesEquivalente } from "./sitio";

describe("precios publicados", () => {
  it("el anual coincide con lo que cobra Stripe", () => {
    expect(PRECIOS.anual).toBe(69);
    expect(PRECIOS.mensual).toBe(9.99);
    expect(precioMesEquivalente).toBeCloseTo(5.75, 2);
  });
});

describe("titular", () => {
  it("identifica por completo a MONETIX LLC, sin marcadores pendientes", () => {
    expect(TITULAR.nombre).toBe("MONETIX LLC");
    expect(TITULAR_INCOMPLETO).toBe(false);
    expect(JSON.stringify(TITULAR)).not.toMatch(/\[|pendiente/i);
    expect(TITULAR.nif).toContain("30-1506187");
    expect(TITULAR.domicilio).toContain("Clovis, NM 88101");
    expect(TITULAR.email).toBe("hola@oposicionesclaras.com");
    expect(TITULAR.registro).toContain("3275319");
  });
});
