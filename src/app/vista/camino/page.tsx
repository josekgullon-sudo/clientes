import { Cabecera } from "@/components/cabecera";
import { Camino } from "@/components/estudio/camino";
import { Racha } from "@/components/estudio/racha";
import { temasVista } from "../datos";

export default function VistaCamino() {
  return (
    <>
    <Cabecera />
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-8 pb-16">
      <div>
        <h1 className="font-serif text-[2rem] leading-tight font-semibold">Camino de temas</h1>
        <Racha dias={12} protectores={1} />
        <p className="mt-2 text-[0.95rem] text-pizarra">Niveles 1 y 2 en el plan gratis. El resto, con Premium.</p>
      </div>
      <Camino temas={temasVista} premium={false} puedeLeccion />
    </div>
    </>
  );
}
