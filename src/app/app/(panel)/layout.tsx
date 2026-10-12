import Link from "next/link";
import { redirect } from "next/navigation";
import { Cabecera } from "@/components/cabecera";
import { ImportarDemo } from "@/components/importar-demo";
import { Pie } from "@/components/pie";
import { estadisticasUsuario } from "@/lib/datos/estudio";
import { usuarioActual } from "@/lib/datos/usuario";

export default async function LayoutPanel({ children }: LayoutProps<"/app">) {
  await usuarioActual();
  const estudio = await estadisticasUsuario();
  if (estudio && !estudio.onboarding_completado) redirect("/app/onboarding");
  return (
    <>
      <Cabecera
        derecha={
          <nav aria-label="Tu cuenta" className="flex items-center">
            <Link href="/app" className="inline-flex min-h-11 items-center px-1.5 font-semibold hover:underline">
              Panel
            </Link>
            <Link href="/app/estadisticas" className="inline-flex min-h-11 items-center px-1.5 font-semibold hover:underline">
              Progreso
            </Link>
            <Link href="/app/cuenta" className="inline-flex min-h-11 items-center px-1.5 font-semibold hover:underline">
              Cuenta
            </Link>
          </nav>
        }
      />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-8 pb-16">
        <ImportarDemo />
        {children}
      </main>
      <Pie />
    </>
  );
}
