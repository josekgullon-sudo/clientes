import { Cabecera } from "@/components/cabecera";
import { Camino } from "@/components/estudio/camino";
import { temasVista } from "../datos";

export default function VistaCamino() {
  return (
    <>
      <Cabecera />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-8 pb-16">
        <h1 className="text-center font-serif text-3xl font-semibold">Camino</h1>
        <Camino temas={temasVista} premium={false} puedeLeccion />
      </div>
    </>
  );
}
