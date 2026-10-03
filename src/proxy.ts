import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refresca la sesión de Supabase y protege el área privada (/app). */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          for (const { name, value } of lista) request.cookies.set(name, value);
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/app")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = `?siguiente=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(destino);
  }

  return respuesta;
}

export const config = {
  matcher: ["/app/:path*", "/entrar", "/auth/:path*", "/suscripcion/:path*"],
};
