import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";

/** Latido de la pestaña visible. No guarda IP. */
export async function POST() {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return new NextResponse(null, { status: 401 });

  const { error } = await supabase.rpc("latido");
  if (error) console.error("latido", error.message);
  return new NextResponse(null, { status: 204 });
}
