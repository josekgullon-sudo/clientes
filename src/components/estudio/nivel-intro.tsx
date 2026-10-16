import type { ReactNode } from "react";
import { Clara } from "@/components/mascota/clara";

/** Primera pantalla tras el registro: 10 preguntas, o saltar. */
export function NivelIntro({ acciones }: { acciones: ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-lectura flex-col gap-6 px-4 pt-8">
      <div className="flex flex-col items-center text-center">
        <Clara pose="piensa" className="size-32" />
        <p className="antetitulo mt-4">Para situarte</p>
        <h1 className="font-display text-[2rem] leading-tight font-black">Test de nivel</h1>
        <p className="mt-1 max-w-xs font-semibold text-pizarra">10 preguntas de varios temas. Al acabar te digo por dónde empezar.</p>
      </div>
      <div className="flex flex-col gap-3">{acciones}</div>
    </section>
  );
}
