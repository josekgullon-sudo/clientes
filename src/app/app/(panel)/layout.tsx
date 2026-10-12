import { redirect } from "next/navigation";
import { NavApp } from "@/components/app/nav-app";
import { Cabecera } from "@/components/cabecera";
import { ImportarDemo } from "@/components/importar-demo";
import { estadisticasUsuario } from "@/lib/datos/estudio";
import { usuarioActual } from "@/lib/datos/usuario";

export default async function LayoutPanel({ children }: LayoutProps<"/app">) {
  await usuarioActual();
  const estudio = await estadisticasUsuario();
  if (estudio && !estudio.onboarding_completado) redirect("/app/onboarding");
  return (
    <>
      <Cabecera inicio="/app" derecha={<NavApp lugar="cabecera" />} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-6 pb-28 md:pt-10 md:pb-16">
        <ImportarDemo />
        {children}
      </main>
      <NavApp lugar="inferior" />
    </>
  );
}
