import type { Metadata } from "next";
import { EmbudoVista } from "@/components/admin/embudo";
import { cargarEmbudo, cargarFuentes } from "@/lib/admin/cargar-embudo";
import { leerRango, origenConsulta } from "@/lib/admin/embudo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Embudo",
  robots: { index: false, follow: false },
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : "";
}

export default async function PaginaEmbudo({ searchParams }: PageProps<"/admin/embudo">) {
  const q = await searchParams;
  const desde = texto(q.desde);
  const hasta = texto(q.hasta);
  const origenPedido = texto(q.origen);
  const rango = leerRango(desde, hasta);
  const origen = origenConsulta(origenPedido);
  const fuentes = await cargarFuentes().catch(() => []);
  const pasos = rango.ok
    ? await cargarEmbudo(rango.desde, rango.hasta, origen).catch((error: unknown) => {
        console.error("admin embudo", error instanceof Error ? error.message : "error");
        return null;
      })
    : null;

  return (
    <EmbudoVista
      desde={desde}
      hasta={hasta}
      origen={origen ?? ""}
      fuentes={fuentes}
      pasos={pasos}
      fechasInvalidas={!rango.ok}
    />
  );
}
