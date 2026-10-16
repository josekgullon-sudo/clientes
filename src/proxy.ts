import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Reenvía la petición con las cookies ya refrescadas para que el Server Component las vea. */
function continuar(request: NextRequest) {
  const cabeceras = new Headers(request.headers);
  cabeceras.set("x-ruta", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: cabeceras } });
}

function esRutaAdmin(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");
}

/** Refresca la sesión de Supabase y protege el área privada (/app). /admin también refresca, sin redirigir. */
export async function proxy(request: NextRequest) {
  let respuesta = continuar(request);

  if (esRutaAdmin(request.nextUrl.pathname)) {
    respuesta.headers.set("Cache-Control", "private, no-store, max-age=0");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return respuesta;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista, cabecerasExtra) => {
          for (const { name, value } of lista) request.cookies.set(name, value);
          respuesta = continuar(request);
          for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
          if (cabecerasExtra) {
            for (const [clave, valor] of Object.entries(cabecerasExtra)) respuesta.headers.set(clave, valor);
          }
          if (esRutaAdmin(request.nextUrl.pathname)) {
            respuesta.headers.set("Cache-Control", "private, no-store, max-age=0");
          }
        },
      },
    },
  );

  // getClaims refresca la sesión si el access token está caducado o a punto de caducar, y valida
  // el JWT. Con claves asimétricas no va al servidor de Auth. /admin entra en el matcher para que
  // ese refresco ocurra aquí: un Server Component no puede guardar las cookies nuevas.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && request.nextUrl.pathname.startsWith("/app")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = `?siguiente=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
    const redir = NextResponse.redirect(destino);
    for (const cookie of respuesta.cookies.getAll()) redir.cookies.set(cookie);
    return redir;
  }

  return respuesta;
}

export const config = {
  matcher: ["/app/:path*", "/entrar", "/auth/:path*", "/suscripcion/:path*", "/admin", "/admin/:path*", "/api/admin/:path*"],
};
