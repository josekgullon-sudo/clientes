import { NextResponse } from "next/server";
import { cronAutorizado, ejecutarEmails } from "@/lib/email/enviar";

export const dynamic = "force-dynamic";

async function ejecutar(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "no autorizado", motivo: "Falta CRON_SECRET en Vercel (al menos 16 caracteres)." },
      { status: 401 },
    );
  }
  if (!cronAutorizado(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  return NextResponse.json(await ejecutarEmails());
}

export async function GET(req: Request) {
  return ejecutar(req);
}

export async function POST(req: Request) {
  return ejecutar(req);
}
