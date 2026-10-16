import { NextResponse, type NextRequest } from "next/server";
import { leerBaja } from "@/lib/email/token";
import { supabaseAdmin } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

/** Baja en un clic desde el cliente de correo (List-Unsubscribe-Post). */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  if (token === "vista") return NextResponse.json({ ok: true });
  const secreto = process.env.CRON_SECRET ?? "";
  const id = leerBaja(token, secreto);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const admin = supabaseAdmin();
  const { error } = await admin.from("preferencias_email").upsert({
    usuario_id: id,
    avisos: false,
    actualizado_en: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ ok: false }, { status: 400 });
  await admin.from("perfil_estudio").update({ recordatorio_email: false }).eq("usuario_id", id);
  return NextResponse.json({ ok: true });
}
