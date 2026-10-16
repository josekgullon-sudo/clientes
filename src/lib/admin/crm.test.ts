import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { correoDeClaims, esCorreoAdmin, parsearCorreos } from "./correos";
import { notaValida } from "./notas";

function sql(nombre: string) {
  return readFileSync(resolve("supabase/migrations", nombre), "utf8");
}

describe("acceso de admin", () => {
  it("solo deja pasar un correo de la lista", () => {
    const correos = parsearCorreos("josekgullon@gmail.com");
    expect(esCorreoAdmin(correoDeClaims({ email: "JoseKGullon@gmail.com" }), correos)).toBe(true);
    expect(esCorreoAdmin(correoDeClaims({ user_metadata: { email: "otra@test.dev" } }), correos)).toBe(false);
    expect(esCorreoAdmin(correoDeClaims(null), correos)).toBe(false);
    expect(esCorreoAdmin("", correos)).toBe(false);
  });
});

describe("notas de admin", () => {
  it("recorta y rechaza una nota vacía o enorme", () => {
    expect(notaValida("  Hola  ")).toBe("Hola");
    expect(notaValida("  ")).toBeNull();
    expect(notaValida("a".repeat(2001))).toBeNull();
    expect(notaValida(12)).toBeNull();
  });
});

describe("migraciones del CRM", () => {
  it("las lecturas de admin solo las ejecuta el service role", () => {
    const admin = sql("20261016130000_admin_crm.sql");
    const origenes = sql("20261016140000_exportaciones_origenes.sql");
    const sesiones = sql("20261016150000_sesiones.sql");
    const notas = sql("20261016160000_notas_purga.sql");
    const juntos = [admin, origenes, sesiones, notas].join("\n");
    for (const fn of ["admin_embudo", "admin_usuarios", "admin_usuario", "admin_origenes", "admin_sesiones", "purgar_eventos_antiguos"]) {
      expect(juntos).toContain(`function public.${fn}`);
    }
    expect(juntos.match(/auth\.role\(\) is distinct from 'service_role'/g)?.length).toBeGreaterThanOrEqual(6);
    expect(admin).toContain("revoke all on function public.admin_usuarios(text, text, text, int, int) from public, anon, authenticated");
    expect(sesiones).toContain("grant execute on function public.latido() to authenticated");
    expect(sesiones).not.toContain("grant execute on function public.admin_sesiones(uuid) to authenticated");
    expect(notas).toContain("interval '24 months'");
    expect(notas).toContain("notas_admin");
  });
});
