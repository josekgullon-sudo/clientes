import { describe, expect, it } from "vitest";
import { PRECIOS, TITULAR, precioMesEquivalente } from "./sitio";

describe("precios publicados", () => {
  it("el anual coincide con lo que cobra Stripe", () => {
    expect(PRECIOS.anual).toBe(69);
    expect(PRECIOS.mensual).toBe(9.99);
    expect(precioMesEquivalente).toBeCloseTo(5.75, 2);
  });
});

describe("titular", () => {
  it("identifica a MONETIX LLC y marca lo que falta, sin corchetes de marcador", () => {
    expect(TITULAR.nombre).toBe("MONETIX LLC");
    expect(JSON.stringify(TITULAR)).not.toContain("[");
    expect(TITULAR.nif.toLowerCase()).toContain("ein");
    expect(TITULAR.domicilio.toLowerCase()).toContain("dirección");
    expect(TITULAR.email.toLowerCase()).toContain("pendiente");
  });
});
