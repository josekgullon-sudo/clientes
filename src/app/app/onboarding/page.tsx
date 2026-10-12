import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Cabecera } from "@/components/cabecera";
import { estadisticasUsuario } from "@/lib/datos/estudio";
import { progresoPorTema } from "@/lib/datos/usuario";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Empieza", robots: { index: false } };

export default async function Onboarding() {
  const [estadisticas, progreso] = await Promise.all([estadisticasUsuario(), progresoPorTema()]);
  if (estadisticas?.onboarding_completado) redirect("/app");
  const tema = progreso.find((t) => t.total > 0) ?? null;
  return (
    <>
      <Cabecera inicio="/app" derecha={null} />
      <main className="mx-auto w-full max-w-lectura flex-1 px-4 pt-6 pb-16">
        <OnboardingForm temaId={tema?.tema_id ?? null} tema={tema ? { numero: tema.numero, titulo: tema.titulo } : null} />
      </main>
    </>
  );
}
