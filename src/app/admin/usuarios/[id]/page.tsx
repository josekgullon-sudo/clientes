import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FichaPersonaVista } from "@/components/admin/ficha-persona";
import { cargarFicha, cargarSesiones } from "@/lib/admin/cargar-personas";
import { esUuid } from "@/lib/admin/personas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Persona",
  robots: { index: false, follow: false },
};

export default async function PaginaPersona({ params }: PageProps<"/admin/usuarios/[id]">) {
  const { id } = await params;
  if (!esUuid(id)) notFound();
  const ficha = await cargarFicha(id).catch((error: unknown) => {
    console.error("admin ficha", error instanceof Error ? error.message : "error");
    return undefined;
  });
  if (ficha === null) notFound();
  if (!ficha) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-16">
        <h1 className="font-display text-2xl font-extrabold">Persona</h1>
        <p className="mt-3 text-pizarra">No se ha podido leer la ficha. Revisa la clave de servicio y la migración del CRM.</p>
      </main>
    );
  }
  const sesiones = await cargarSesiones(id).catch((error: unknown) => {
    console.error("admin sesiones", error instanceof Error ? error.message : "error");
    return null;
  });
  return <FichaPersonaVista ficha={ficha} sesiones={sesiones} />;
}
