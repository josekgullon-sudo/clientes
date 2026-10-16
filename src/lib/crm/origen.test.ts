import { describe, expect, it } from "vitest";
import { limpiarOrigen, origenDeParametros, referrerSeguro } from "./origen";

describe("origen de la visita", () => {
  it("lee UTM y gclid y descarta el resto", () => {
    const params = new URLSearchParams("utm_source=google&utm_medium=cpc&gclid=abc123&email=a@b.c&utm_campaign=mayo");
    expect(origenDeParametros(params)).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "mayo",
      gclid: "abc123",
    });
  });

  it("sin consentimiento no guarda referrer ni landing", () => {
    expect(
      limpiarOrigen(
        { utm_source: "newsletter", referrer: "https://google.es", landing: "/test", ip: "1.1.1.1" },
        false,
      ),
    ).toEqual({ utm_source: "newsletter" });
  });

  it("con consentimiento guarda la llegada y el referrer, no la IP", () => {
    expect(
      limpiarOrigen(
        { utm_source: "google", referrer: "https://google.es/aclk", landing: "/?utm_source=google", ip: "1.1.1.1" },
        true,
      ),
    ).toEqual({
      utm_source: "google",
      referrer: "https://google.es/aclk",
      landing: "/?utm_source=google",
    });
  });

  it("el referrer propio no cuenta y se le quita la query", () => {
    expect(referrerSeguro("https://oposicionesclaras.com/entrar?token=1", "https://oposicionesclaras.com")).toBe("");
    expect(referrerSeguro("https://www.google.com/search?q=oposiciones", "https://oposicionesclaras.com")).toBe(
      "https://www.google.com/search",
    );
  });

  it("un objeto vacío no es un origen", () => {
    expect(limpiarOrigen({}, true)).toBeNull();
    expect(limpiarOrigen(null, true)).toBeNull();
  });
});
