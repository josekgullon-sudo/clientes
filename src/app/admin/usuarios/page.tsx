import type { Metadata } from "next";
import { ListaPersonasVista } from "@/components/admin/lista-personas";
import { cargarPersonas } from "@/lib/admin/cargar-personas";
import { consultaPersonas } from "@/lib/admin/personas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Personas",
  robots: { index: false, follow: false },
};

export default async function PaginaPersonas({ searchParams }: PageProps<"/admin/usuarios">) {
  const consulta = consultaPersonas(await searchParams);
  const datos = await cargarPersonas(consulta.filtro, consulta.busqueda, consulta.orden, consulta.offset).catch((error: unknown) => {
    console.error("admin personas", error instanceof Error ? error.message : "error");
    return null;
  });
  return <ListaPersonasVista consulta={consulta} datos={datos} />;
}
