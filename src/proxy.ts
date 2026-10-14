import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refresca la sesión de Supabase y protege el área privada (/app). */
export async function proxy(request: NextRequest) {
  const cabeceras = new Headers(request.headers);
  cabeceras.set("x-ruta", request.nextUrl.pathname);
  let respuesta = NextResponse.next({ request: { headers: cabeceras } });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return respuesta;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          for (const { name, value } of lista) request.cookies.set(name, value);
          const siguientes = new Headers(request.headers);
          siguientes.set("x-ruta", request.nextUrl.pathname);
          respuesta = NextResponse.next({ request: { headers: siguientes } });
          for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
        },
      },
    },
  );

  // getClaims refresca la sesión si hace falta y valida el token; con claves asimétricas lo hace
  // sin ir al servidor de Auth, que es lo que más tarda en cada navegación.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && request.nextUrl.pathname.startsWith("/app")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = `?siguiente=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(destino);
  }

  return respuesta;
}

export const config = {
  matcher: ["/app/:path*", "/entrar", "/auth/:path*", "/suscripcion/:path*", "/admin", "/admin/:path*"],
};
