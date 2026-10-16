import { NextResponse, type NextRequest } from "next/server";
import { metaEvento } from "@/lib/crm/eventos";
import { supabaseServidor } from "@/lib/supabase/servidor";

/** Hechos que anota el navegador. Hoy solo la vista de precios; el resto se anota en el servidor. */
const DESDE_CLIENTE = new Set(["vista_precios"]);

export async function POST(request: NextRequest) {
  const cuerpo = await request.json().catch(() => null);
  const tipo = typeof cuerpo?.tipo === "string" ? cuerpo.tipo : "";
  if (!DESDE_CLIENTE.has(tipo)) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return NextResponse.json({ ok: false }, { status: 401 });

  const { error } = await supabase.rpc("registrar_evento", {
    p_tipo: tipo,
    p_meta: metaEvento(cuerpo?.meta),
  });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
