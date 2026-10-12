import { EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { Anillo } from "@/components/estudio/anillo";
import { Camino } from "@/components/estudio/camino";
import { Racha } from "@/components/estudio/racha";
import { temasVista } from "../datos";

export default function VistaPanel() {
  return (
    <>
    <Cabecera />
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-8 pb-16">
      <section className="flex items-center gap-4">
        <Anillo hecho={4} objetivo={10} />
        <div>
          <h1 className="font-serif text-[2rem] leading-tight font-semibold">Tu estudio</h1>
          <Racha dias={12} protectores={1} />
          <p className="text-[0.95rem] text-pizarra">Hoy 4 de 10 · 240 XP · 215 días para el examen</p>
        </div>
      </section>
      <EnlaceBoton href="/vista/test" ancho>
        Continuar: Tema 1 · 10 preguntas · 5 min
      </EnlaceBoton>
      <section>
        <h2 className="font-serif text-xl font-semibold">Camino de temas</h2>
        <p className="mt-1 mb-4 text-[0.95rem] text-pizarra">Cinco niveles por tema. El nivel 5 es el examen del tema.</p>
        <Camino temas={temasVista} premium={false} puedeLeccion />
      </section>
    </div>
    </>
  );
}
