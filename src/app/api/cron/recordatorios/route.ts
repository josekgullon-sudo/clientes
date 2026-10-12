import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

function autorizado(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  return req.headers.get("authorization") === `Bearer ${secreto}`;
}

async function ejecutar() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ estado: "preparado", motivo: "falta la configuración de Supabase" });
  }

  const admin = supabaseAdmin();
  await admin.rpc("mantenimiento_rachas");
  const { data, error } = await admin.rpc("usuarios_recordatorio");
  if (error) {
    return NextResponse.json({ estado: "error", motivo: error.message }, { status: 500 });
  }

  const lista = (data ?? []) as { usuario_id: string; email: string; racha: number; tipo: string }[];
  if (!process.env.RESEND_API_KEY || !process.env.RECORDATORIO_FROM) {
    return NextResponse.json({
      estado: "preparado",
      pendientes: lista.length,
      motivo: "faltan RESEND_API_KEY o RECORDATORIO_FROM; no se marca ningún envío",
    });
  }

  const origen = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let enviados = 0;
  for (const u of lista) {
    const asunto = u.tipo === "racha" ? `Tu racha de ${u.racha} días te espera` : "Hace días que no estudias";
    const texto =
      u.tipo === "racha"
        ? `Tu racha de ${u.racha} días te espera. Cinco preguntas y la salvas.`
        : "Cuando quieras, diez preguntas y vuelves al camino.";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RECORDATORIO_FROM,
        to: u.email,
        subject: asunto,
        text: `${texto}\n\n${origen}/app\n\nPuedes apagar estos avisos en tu cuenta.`,
      }),
    });
    if (!res.ok) continue;
    const { error: marca } = await admin.from("notificaciones_enviadas").insert({
      usuario_id: u.usuario_id,
      tipo: u.tipo,
      canal: "email",
    });
    if (!marca) enviados += 1;
  }

  return NextResponse.json({ estado: "enviado", enviados, candidatos: lista.length });
}

export async function POST(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  return ejecutar();
}

export async function GET(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  return ejecutar();
}
