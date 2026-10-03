import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";

/** Vuelta del enlace mágico o de Google: canjea el código por la sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const s = searchParams.get("siguiente") ?? "/app";
  const siguiente = s.startsWith("/") && !s.startsWith("//") ? s : "/app";

  if (code) {
    const supabase = await supabaseServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(siguiente, origin));
  }
  return NextResponse.redirect(new URL("/entrar?error=enlace", origin));
}
