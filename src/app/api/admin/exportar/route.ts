import { NextResponse, type NextRequest } from "next/server";
import { esAdmin } from "@/lib/admin/acceso";
import { listarParaExportar } from "@/lib/admin/cargar-personas";
import { csvPersonas } from "@/lib/admin/embudo";
import { consultaPersonas } from "@/lib/admin/personas";
import { claimsActuales } from "@/lib/datos/usuario";
import { supabaseAdmin } from "@/lib/supabase/servidor";

export async function GET(request: NextRequest) {
  if (!(await esAdmin())) return new NextResponse("No encontrado", { status: 404 });

  const q = request.nextUrl.searchParams;
  const consulta = consultaPersonas({
    q: q.get("q") ?? undefined,
    filtro: q.get("filtro") ?? undefined,
    orden: q.get("orden") ?? undefined,
  });

  let filas;
  try {
    filas = await listarParaExportar(consulta);
  } catch (error) {
    console.error("exportar personas", error instanceof Error ? error.message : "error");
    return new NextResponse("No se ha podido preparar el archivo.", { status: 500 });
  }

  const claims = await claimsActuales();
  const adminId = typeof claims?.sub === "string" ? claims.sub : null;
  const { error } = await supabaseAdmin().from("exportaciones_admin").insert({
    admin_id: adminId,
    que: "personas",
    meta: {
      filtro: consulta.filtro,
      orden: consulta.orden,
      filas: filas.length,
      busqueda: consulta.busqueda ? "si" : "no",
    },
  });
  if (error) {
    console.error("exportar personas", error.message);
    return new NextResponse("No se ha podido registrar la exportación.", { status: 500 });
  }

  return new NextResponse(csvPersonas(filas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="personas.csv"',
      "Cache-Control": "no-store",
    },
  });
}
