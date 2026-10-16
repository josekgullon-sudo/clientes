import { describe, expect, it } from "vitest";
import { celdaCsv, csvPersonas, inicioDiaMadrid, leerRango, origenConsulta, porcentaje } from "./embudo";

describe("embudo", () => {
  it("convierte el día de Madrid, también en el cambio de hora", () => {
    expect(inicioDiaMadrid("2026-01-15")).toBe("2026-01-14T23:00:00.000Z");
    expect(inicioDiaMadrid("2026-07-15")).toBe("2026-07-14T22:00:00.000Z");
    expect(inicioDiaMadrid("2026-02-31")).toBeNull();
    expect(inicioDiaMadrid("15-01-2026")).toBeNull();
  });

  it("deja el último día incluido y rechaza un rango al revés", () => {
    const rango = leerRango("2026-07-01", "2026-07-02");
    expect(rango).toEqual({
      ok: true,
      desde: "2026-06-30T22:00:00.000Z",
      hasta: "2026-07-02T22:00:00.000Z",
    });
    expect(leerRango("2026-07-03", "2026-07-01").ok).toBe(false);
    expect(leerRango("", "").ok).toBe(true);
  });

  it("acepta gclid y una fuente corta", () => {
    expect(origenConsulta("")).toBeNull();
    expect(origenConsulta("todos")).toBeNull();
    expect(origenConsulta("gclid")).toBe("gclid");
    expect(origenConsulta("google")).toBe("google");
    expect(origenConsulta("a b")).toBeNull();
    expect(origenConsulta("utm' or 1=1")).toBeNull();
  });

  it("calcula el porcentaje y escapa el CSV", () => {
    expect(porcentaje(1, 4)).toBe(25);
    expect(porcentaje(1, 0)).toBeNull();
    expect(celdaCsv('di "hola"')).toBe('"di ""hola"""');
    expect(celdaCsv("=cmd")).toBe("'=cmd");
    const csv = csvPersonas([
      {
        email: "a@test.dev",
        registro: "2026-01-01T00:00:00Z",
        ultimo_acceso: null,
        tests: 0,
        plan: null,
        estado: null,
        racha: 0,
        xp: 0,
        hizo_test: false,
        limite: false,
        precios: true,
        checkout: false,
        pago: false,
      },
    ]);
    expect(csv.startsWith("\uFEFFcorreo,registro")).toBe(true);
    expect(csv).toContain("a@test.dev");
    expect(csv).not.toContain("respuesta");
  });
});
