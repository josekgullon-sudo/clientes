import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { construirRutas, diasEntre, elegirSemana, semanaISO, slugTema } from "./seleccion";

describe("selección pública", () => {
  it("rota las mismas 10 preguntas dentro de una semana y cambia al pasar de semana", () => {
    const banco = Array.from({ length: 25 }, (_, i) => `p${i}`);
    const lunes = new Date("2026-10-12T10:00:00Z");
    const martes = new Date("2026-10-13T10:00:00Z");
    const otra = new Date("2026-10-19T10:00:00Z");
    const a = elegirSemana(banco, "ley-40-2015", lunes);
    const b = elegirSemana(banco, "ley-40-2015", martes);
    const c = elegirSemana(banco, "ley-40-2015", otra);
    expect(a).toHaveLength(10);
    expect(a).toEqual(b);
    expect(c).not.toEqual(a);
    expect(new Set(a).size).toBe(10);
  });

  it("deja el banco corto entero", () => {
    expect(elegirSemana(["a", "b"], "x", new Date())).toEqual(["a", "b"]);
  });

  it("genera un slug estable de tema", () => {
    expect(slugTema(11, "Las Leyes del Procedimiento Administrativo Común")).toBe(
      "tema-11-las-leyes-del-procedimiento-administrativo-comun",
    );
  });

  it("cuenta los días de calendario", () => {
    expect(diasEntre("2026-10-12", "2027-05-15")).toBe(215);
    expect(semanaISO(new Date("2026-10-12T12:00:00Z"))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("supera las 40 URL indexables con el temario y las leyes reales", () => {
    const leyes = JSON.parse(readFileSync(join(process.cwd(), "datos/leyes.json"), "utf8")) as { slug: string }[];
    const opos = JSON.parse(readFileSync(join(process.cwd(), "datos/oposiciones.json"), "utf8")) as {
      temas: { numero: number; titulo: string }[];
    }[];
    const rutas = construirRutas({ leyes, temas: opos[0].temas });
    // Leyes + 28 temas. La home y las páginas legales suman el resto.
    expect(rutas.length).toBeGreaterThanOrEqual(38);
    expect(new Set(rutas.map((r) => r.slug)).size).toBe(rutas.length);
  });
});
