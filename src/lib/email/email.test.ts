import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { elegirEnvio, enVentana, filtrarTipos, relojMadrid, type RelojMadrid, type TipoEmail } from "./horario";
import { LOGO_EMAIL, plantilla } from "./plantillas";
import { firmarBaja, leerBaja } from "./token";

const secreto = "cron-secreto-de-prueba";
const uid = "11111111-1111-4111-8111-111111111111";

function reloj(parcial: Partial<RelojMadrid>): RelojMadrid {
  return { hora: 10, dia: "2026-07-13", lunes: false, martes: false, miercoles: false, ...parcial };
}

describe("horario de correos", () => {
  it("usa la hora de Madrid, en verano y en invierno", () => {
    expect(relojMadrid(new Date("2026-07-15T17:00:00Z")).hora).toBe(19);
    expect(relojMadrid(new Date("2026-01-15T18:00:00Z")).hora).toBe(19);
    expect(relojMadrid(new Date("2026-07-15T16:00:00Z")).hora).toBe(18);
    expect(relojMadrid(new Date("2026-01-15T16:00:00Z")).hora).toBe(17);
    expect(relojMadrid(new Date("2026-07-13T07:00:00Z")).lunes).toBe(true);
    expect(relojMadrid(new Date("2026-07-13T06:59:00Z")).hora).toBe(8);
  });

  it("la pasada de las 16:00 UTC entra en la ventana y manda un solo aviso", () => {
    const verano = relojMadrid(new Date("2026-07-15T16:00:00Z"));
    const invierno = relojMadrid(new Date("2026-01-15T16:00:00Z"));
    expect(enVentana(verano)).toBe(true);
    expect(enVentana(invierno)).toBe(true);
    expect(elegirEnvio(["racha"], verano)).toBe("racha");
    expect(elegirEnvio(["racha"], invierno)).toBe("racha");
    expect(elegirEnvio(["racha", "resumen", "reenganche_3"], verano)).toBe("racha");
    expect(elegirEnvio(["resumen"], { ...verano, lunes: true })).toBe("resumen");
    expect(elegirEnvio(["reenganche_7"], invierno)).toBe("reenganche_7");
    expect(elegirEnvio(["bienvenida"], verano)).toBe("bienvenida");
    expect(elegirEnvio(["tope"], invierno)).toBe("tope");
    expect(elegirEnvio(["sin_test"], verano)).toBe("sin_test");
  });

  it("reserva el día para la racha y no manda el tope a quien paga", () => {
    expect(elegirEnvio(["racha"], reloj({ hora: 10 }))).toBeNull();
    expect(elegirEnvio(["racha"], reloj({ hora: 16 }))).toBeNull();
    expect(elegirEnvio(["racha"], reloj({ hora: 17 }))).toBe("racha");
    expect(elegirEnvio(["racha"], reloj({ hora: 18 }))).toBe("racha");
    expect(elegirEnvio(["racha"], reloj({ hora: 19 }))).toBe("racha");
    expect(elegirEnvio(["racha"], reloj({ hora: 20 }))).toBe("racha");
    expect(elegirEnvio(["racha"], reloj({ hora: 21 }))).toBeNull();
    expect(elegirEnvio(["bienvenida", "racha"], reloj({ hora: 10 }))).toBe("bienvenida");
    expect(elegirEnvio(["resumen", "racha"], reloj({ hora: 10, lunes: true }))).toBeNull();
    expect(elegirEnvio(["resumen"], reloj({ hora: 10, lunes: true }))).toBe("resumen");
    expect(elegirEnvio(["resumen"], reloj({ hora: 11, martes: true }))).toBe("resumen");
    expect(elegirEnvio(["resumen"], reloj({ hora: 11 }))).toBeNull();
    expect(elegirEnvio(["reenganche_3", "reenganche_7"], reloj({ hora: 12 }))).toBe("reenganche_7");
    expect(filtrarTipos(["tope", "racha"], true)).toEqual(["racha"]);
    expect(elegirEnvio(filtrarTipos(["tope"], true), reloj({ hora: 10 }))).toBeNull();
  });
});

describe("baja firmada", () => {
  it("acepta el enlace y rechaza uno manipulado", () => {
    const token = firmarBaja(uid, secreto);
    expect(leerBaja(token, secreto)).toBe(uid);
    expect(leerBaja(`${uid}.otra`, secreto)).toBeNull();
    expect(leerBaja(token, "otro-secreto-largo")).toBeNull();
    expect(leerBaja(token, "corto")).toBeNull();
  });
});

describe("plantillas", () => {
  it("lleva la marca, la baja y no mete datos de pago", () => {
    const urls = { origen: "https://oposicionesclaras.com", baja: "https://oposicionesclaras.com/baja?t=vista" };
    for (const tipo of ["bienvenida", "racha", "reenganche_3", "reenganche_7", "sin_test", "tope", "resumen"] as TipoEmail[]) {
      const correo = plantilla(tipo, { racha: 4, tests: 3, aciertos: 20, tema: "12. El acto <admin>" }, urls);
      expect(correo.html).toContain("#0EB5A0");
      expect(correo.html).toContain("Poppins");
      expect(correo.html).toContain(LOGO_EMAIL);
      expect(correo.html).toContain("clara-");
      expect(correo.html).toContain(urls.baja);
      expect(correo.html.toLowerCase()).not.toContain("tarjeta");
      expect(correo.texto).toContain(urls.baja);
    }
    const tope = plantilla("tope", {}, urls);
    expect(tope.html).toContain("9,99");
    expect(tope.html).toContain("69 €");
    expect(tope.html).toContain("/suscripcion");
    const sin = plantilla("sin_test", {}, urls);
    expect(sin.html).toContain("/app/diez");
    const resumen = plantilla("resumen", { tests: 2, aciertos: 5, tema: "12. El acto <admin>" }, urls);
    expect(resumen.html).toContain("El acto &lt;admin&gt;");
  });
});

describe("migración de correos", () => {
  it("solo la lee el service role y anota el envío en eventos", () => {
    const sql = readFileSync(resolve("supabase/migrations/20261016170000_emails.sql"), "utf8");
    expect(sql).toContain("preferencias_email");
    expect(sql).toContain("emails_enviados");
    expect(sql).toContain("'email_enviado'");
    expect(sql).toContain("unique (usuario_id, dia)");
    expect(sql).toContain("auth.role() is distinct from 'service_role'");
    expect(sql).toContain("deleted_at is null");
    expect(sql).not.toContain("grant execute on function public.emails_candidatos() to authenticated");
  });
});
