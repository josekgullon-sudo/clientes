import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { elegirTestDelDia, type CandidataDia } from "./test-del-dia";
import { porcentajesPorTema, recomendarInicio } from "../test/nivel";
import type { PreguntaTest } from "../test/tipos";

function banco(temas: number, porTema: number): CandidataDia[] {
  const lista: CandidataDia[] = [];
  for (let tema = 1; tema <= temas; tema += 1) {
    for (let n = 1; n <= porTema; n += 1) {
      lista.push({ id: `t${tema}-p${String(n).padStart(2, "0")}`, tema: `tema-${tema}` });
    }
  }
  return lista;
}

describe("test de hoy", () => {
  const candidatas = banco(4, 8);

  it("elige las mismas 10 para la misma fecha y otras si cambia el día", () => {
    const a = elegirTestDelDia(candidatas, "2026-10-16");
    const b = elegirTestDelDia([...candidatas].reverse(), "2026-10-16");
    expect(a).toEqual(b);
    expect(a).toHaveLength(10);
    expect(new Set(a).size).toBe(10);
    expect(elegirTestDelDia(candidatas, "2026-10-17")).not.toEqual(a);
  });

  it("reparte entre temas antes de repetir uno", () => {
    const elegidas = elegirTestDelDia(banco(2, 20), "2026-10-16");
    const temas = elegidas.map((id) => id.split("-")[0]);
    expect(temas.filter((tema) => tema === "t1")).toHaveLength(5);
    expect(temas.filter((tema) => tema === "t2")).toHaveLength(5);
  });
});

describe("test de nivel", () => {
  const pregunta = (id: string, tema: number, correcta = 0): PreguntaTest => ({
    id,
    enunciado: "¿?",
    opciones: ["a", "b", "c", "d"],
    correcta,
    explicacion: "",
    articulo: "1",
    ley: "Ley 39/2015",
    tema: { id: `id-${tema}`, numero: tema, titulo: `Título ${tema}` },
  });

  it("calcula el porcentaje y recomienda el tema más flojo", () => {
    const preguntas = [pregunta("a", 2), pregunta("b", 2), pregunta("c", 4), pregunta("d", 1)];
    const temas = porcentajesPorTema(
      preguntas,
      new Map([
        ["a", 0],
        ["b", 1],
        ["c", 1],
        ["d", 0],
      ]),
    );
    expect(temas.map((tema) => [tema.numero, tema.porcentaje])).toEqual([
      [2, 50],
      [4, 0],
      [1, 100],
    ].sort((a, b) => a[1] - b[1] || a[0] - b[0]));
    expect(recomendarInicio(temas)?.temaId).toBe("id-4");
    expect(recomendarInicio([])).toBeNull();
  });
});

describe("migración de retención", () => {
  it("deja el test de hoy determinista y el de nivel una sola vez", () => {
    const modos = readFileSync(resolve("supabase/migrations/20261016180000_modos.sql"), "utf8");
    const sql = readFileSync(resolve("supabase/migrations/20261016180000_retencion.sql"), "utf8");
    expect(modos).toContain("add value if not exists 'nivel'");
    expect(modos).toContain("add value if not exists 'hoy'");
    expect(sql).toContain("test_del_dia");
    expect(sql).toContain("md5(p_dia::text || ':' || p.id)");
    expect(sql).toContain("nivel_omitido_en");
    expect(sql).toContain("'nivel_fin'");
    expect(sql).toContain("'nivel_salto'");
    expect(sql).toContain("'email_enviado'");
    expect(sql).toContain("modo in ('tema', 'leccion', 'hoy')");
    expect(sql).not.toContain("grant execute on function public.preguntas_del_dia(uuid, date) to authenticated");
    expect(sql).toContain("grant execute on function public.omitir_nivel() to authenticated");
  });
});
