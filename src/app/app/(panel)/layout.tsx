import { redirect } from "next/navigation";
import { NavApp } from "@/components/app/nav-app";
import { BarraApp } from "@/components/app/barra-app";
import { ImportarDemo } from "@/components/importar-demo";
import { estadisticasUsuario } from "@/lib/datos/estudio";
import { usuarioActual } from "@/lib/datos/usuario";

export default async function LayoutPanel({ children }: LayoutProps<"/app">) {
  const [{ suscrito }, estudio] = await Promise.all([usuarioActual(), estadisticasUsuario()]);
  if (estudio && !estudio.onboarding_completado) redirect("/app/onboarding");
  return (
    <>
      <BarraApp racha={estudio?.racha_actual ?? 0} xp={estudio?.xp_total ?? 0} premium={suscrito} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 lg:max-w-6xl flex-col gap-6 px-4 pt-6 pb-28 md:pt-10 md:pb-16">
        <ImportarDemo />
        {children}
      </main>
      <NavApp lugar="inferior" />
    </>
  );
}
