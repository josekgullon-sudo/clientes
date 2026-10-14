import { describe, expect, it } from "vitest";
import { parsearCorreos } from "./correos";
import { diaMadrid, esPremium, resumirCuentas, serieDias } from "./metricas";

const ahora = new Date("2026-10-14T10:00:00Z");

describe("métricas del panel", () => {
  it("usa el correo por defecto y acepta una lista", () => {
    expect(parsearCorreos(undefined)).toEqual(["josekgullon@gmail.com"]);
    expect(parsearCorreos("")).toEqual(["josekgullon@gmail.com"]);
    expect(parsearCorreos("   ")).toEqual(["josekgullon@gmail.com"]);
    expect(parsearCorreos(",")).toEqual(["josekgullon@gmail.com"]);
    expect(parsearCorreos("  A@B.dev, josekgullon@gmail.com ")).toEqual(["a@b.dev", "josekgullon@gmail.com"]);
  });

  it("cuenta el día de Madrid, no el UTC", () => {
    expect(diaMadrid(new Date("2026-10-13T22:30:00Z"))).toBe("2026-10-14");
    expect(serieDias(30, ahora)).toHaveLength(30);
    expect(serieDias(30, ahora).at(-1)).toBe("2026-10-14");
  });

  it("separa premium activo, MRR y conversión", () => {
    const usuarios = [
      { id: "a", email: "a@test.dev", creado: "2026-10-14T08:00:00Z" },
      { id: "b", email: "b@test.dev", creado: "2026-10-13T22:30:00Z" },
      { id: "c", email: "c@test.dev", creado: "2026-09-01T10:00:00Z" },
      { id: "d", email: "d@test.dev", creado: "2026-10-10T10:00:00Z" },
    ];
    const suscripciones = [
      {
        usuario_id: "a",
        plan: "mensual",
        estado: "active",
        fin_periodo: "2026-11-14T00:00:00Z",
        stripe_subscription_id: "sub_a",
        actualizada_en: "2026-10-14T00:00:00Z",
      },
      {
        usuario_id: "c",
        plan: "anual",
        estado: "trialing",
        fin_periodo: null,
        stripe_subscription_id: "sub_c",
        actualizada_en: "2026-10-01T00:00:00Z",
      },
      {
        usuario_id: "d",
        plan: "mensual",
        estado: "canceled",
        fin_periodo: "2026-10-01T00:00:00Z",
        stripe_subscription_id: "sub_d",
        actualizada_en: "2026-10-02T00:00:00Z",
      },
    ];
    const { kpis, altas } = resumirCuentas(usuarios, suscripciones, ahora);
    expect(esPremium(suscripciones[2], ahora)).toBe(false);
    expect(kpis.premiumMensual).toBe(1);
    expect(kpis.premiumAnual).toBe(1);
    expect(kpis.gratis).toBe(2);
    expect(kpis.conversion).toBe(50);
    expect(kpis.mrrCents).toBe(999 + 575);
    expect(kpis.hoy).toBe(2);
    expect(kpis.treinta).toBe(3);
    expect(altas.reduce((n, p) => n + p.total, 0)).toBe(3);
    expect(altas).toHaveLength(30);
  });
});
