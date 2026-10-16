import type { Metadata } from "next";
import { PanelAdmin } from "@/components/admin/panel";
import { cargarPanel } from "@/lib/admin/cargar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

export default async function PaginaAdmin() {
  const datos = await cargarPanel().catch((error: unknown) => {
    console.error("panel admin", error instanceof Error ? error.message : "error");
    return null;
  });
  if (!datos) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-16">
        <h1 className="font-display text-2xl font-extrabold">Panel</h1>
        <p className="mt-3 text-pizarra">No se han podido leer los datos. Revisa la clave de servicio de Supabase.</p>
      </main>
    );
  }
  return <PanelAdmin datos={datos} />;
}
