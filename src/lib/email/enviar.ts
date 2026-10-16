import "server-only";
import { correoDeClaims } from "@/lib/admin/correos";
import { claimsActuales } from "@/lib/datos/usuario";
import { SITIO } from "@/lib/sitio";
import { supabaseAdmin } from "@/lib/supabase/servidor";
import {
  elegirEnvio,
  enVentana,
  esTipoEmail,
  filtrarTipos,
  relojMadrid,
  type TipoEmail,
} from "./horario";
import { plantilla, muestra, type DatosCorreo } from "./plantillas";
import { firmarBaja } from "./token";

const REMITENTE = "Oposiciones Claras <hola@oposicionesclaras.com>";
const LOTE = 25;

export type Candidato = {
  usuario_id: string;
  email: string;
  tipo: TipoEmail;
  clave: string;
  racha: number;
  premium: boolean;
  tests: number | null;
  aciertos: number | null;
  tema: string | null;
};

export function cronAutorizado(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  return req.headers.get("authorization") === `Bearer ${secreto}`;
}

function secretoBaja() {
  const secreto = process.env.CRON_SECRET ?? "";
  return secreto.length >= 16 ? secreto : "";
}

function origenWeb() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? SITIO.url).replace(/\/$/, "");
}

function tokenBaja(usuarioId: string) {
  const secreto = secretoBaja();
  if (!secreto) return "vista";
  return firmarBaja(usuarioId, secreto);
}

async function enviarResend(destino: string, correo: ReturnType<typeof plantilla>, baja: string, prueba: boolean) {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clave}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: REMITENTE,
      to: destino,
      subject: prueba ? `[Prueba] ${correo.asunto}` : correo.asunto,
      html: correo.html,
      text: correo.texto,
      headers: {
        "List-Unsubscribe": `<${baja}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!res.ok) {
    console.error("resend", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

function datosDe(c: Candidato): DatosCorreo {
  return { racha: c.racha, tests: c.tests, aciertos: c.aciertos, tema: c.tema };
}

/** Apunta el envío antes de llamar a Resend. Si el envío falla, se borra para poder reintentar. */
async function reservar(c: Candidato, dia: string) {
  const admin = supabaseAdmin();
  const { error } = await admin.from("emails_enviados").insert({
    usuario_id: c.usuario_id,
    tipo: c.tipo,
    clave: c.clave,
    dia,
  });
  if (!error) return "nuevo" as const;
  if (error.code === "23505") return "ya" as const;
  console.error("emails_enviados", error.message);
  return "error" as const;
}

async function soltar(c: Candidato) {
  await supabaseAdmin().from("emails_enviados").delete().eq("usuario_id", c.usuario_id).eq("tipo", c.tipo).eq("clave", c.clave);
}

export async function enviarCandidato(c: Candidato, dia: string) {
  if (c.tipo === "tope" && c.premium) return false;
  if (!process.env.RESEND_API_KEY || !secretoBaja()) return false;
  const reserva = await reservar(c, dia);
  if (reserva !== "nuevo") return false;
  const token = tokenBaja(c.usuario_id);
  const baja = `${origenWeb()}/baja?t=${encodeURIComponent(token)}`;
  const correo = plantilla(c.tipo, datosDe(c), { origen: origenWeb(), baja });
  const ok = await enviarResend(c.email, correo, `${origenWeb()}/api/baja?t=${encodeURIComponent(token)}`, false);
  if (!ok) {
    await soltar(c);
    return false;
  }
  const { error } = await supabaseAdmin().from("eventos").insert({
    usuario_id: c.usuario_id,
    tipo: "email_enviado",
    meta: { correo: c.tipo },
  });
  if (error) console.error("email_enviado", error.message);
  return true;
}

export async function intentarBienvenida() {
  try {
    const reloj = relojMadrid();
    if (!enVentana(reloj) || !process.env.RESEND_API_KEY || !secretoBaja()) return;
    const claims = await claimsActuales();
    const email = correoDeClaims(claims);
    const id = typeof claims?.sub === "string" ? claims.sub : "";
    if (!id || !email) return;
    await enviarCandidato(
      { usuario_id: id, email, tipo: "bienvenida", clave: "", racha: 0, premium: false, tests: null, aciertos: null, tema: null },
      reloj.dia,
    );
  } catch (error) {
    console.error("bienvenida", error instanceof Error ? error.message : "error");
  }
}

function candidatosDe(bruto: unknown): Candidato[] {
  if (!Array.isArray(bruto)) return [];
  return bruto.flatMap((fila) => {
    if (!fila || typeof fila !== "object") return [];
    const f = fila as Record<string, unknown>;
    if (typeof f.usuario_id !== "string" || typeof f.email !== "string" || typeof f.tipo !== "string") return [];
    if (!esTipoEmail(f.tipo)) return [];
    return [
      {
        usuario_id: f.usuario_id,
        email: f.email,
        tipo: f.tipo,
        clave: typeof f.clave === "string" ? f.clave : "",
        racha: typeof f.racha === "number" ? f.racha : 0,
        premium: f.premium === true,
        tests: typeof f.tests === "number" ? f.tests : null,
        aciertos: typeof f.aciertos === "number" ? f.aciertos : null,
        tema: typeof f.tema === "string" ? f.tema : null,
      },
    ];
  });
}

export async function ejecutarEmails() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { estado: "preparado", motivo: "Falta la configuración de Supabase" };
  }
  const admin = supabaseAdmin();
  const purga = await admin.rpc("purgar_eventos_antiguos");
  if (purga.error) console.error("purga eventos", purga.error.message);
  const rachas = await admin.rpc("mantenimiento_rachas");
  if (rachas.error) console.error("mantenimiento rachas", rachas.error.message);

  const reloj = relojMadrid();
  if (!enVentana(reloj)) return { estado: "fuera_de_horario", hora: reloj.hora };
  if (!process.env.RESEND_API_KEY) {
    return { estado: "preparado", motivo: "Falta RESEND_API_KEY en Vercel" };
  }
  if (!secretoBaja()) {
    return { estado: "preparado", motivo: "Falta CRON_SECRET en Vercel, de al menos 16 caracteres" };
  }

  const { data, error } = await admin.rpc("emails_candidatos");
  if (error) return { estado: "error", motivo: error.message };

  const porUsuario = new Map<string, Candidato[]>();
  for (const c of candidatosDe(data)) {
    const lista = porUsuario.get(c.usuario_id) ?? [];
    lista.push(c);
    porUsuario.set(c.usuario_id, lista);
  }

  let enviados = 0;
  for (const grupo of porUsuario.values()) {
    if (enviados >= LOTE) break;
    const premium = grupo.some((c) => c.premium);
    const tipo = elegirEnvio(filtrarTipos(grupo.map((c) => c.tipo), premium), reloj);
    if (!tipo) continue;
    const candidato = grupo.find((c) => c.tipo === tipo);
    if (!candidato) continue;
    if (await enviarCandidato(candidato, reloj.dia)) enviados += 1;
  }

  return { estado: "enviado", enviados, candidatos: porUsuario.size };
}

export async function enviarPrueba(destino: string, tipo: TipoEmail) {
  if (!process.env.RESEND_API_KEY) return false;
  const correo = plantilla(tipo, muestra(tipo), { origen: origenWeb(), baja: `${origenWeb()}/baja?t=vista` });
  return enviarResend(destino, correo, `${origenWeb()}/api/baja?t=vista`, true);
}
