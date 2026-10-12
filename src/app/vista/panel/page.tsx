import { EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { Camino } from "@/components/estudio/camino";
import { Tablero } from "@/components/estudio/tablero";
import { temasVista } from "../datos";

export default function VistaPanel() {
  return (
    <>
      <Cabecera />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-8 pb-16">
        <h1 className="font-serif text-3xl font-semibold">Hoy</h1>
        <Tablero racha={12} protectores={1} hecho={4} objetivo={10} xp={240} dias={215} />
        <EnlaceBoton href="/vista/test" ancho>Continuar · Tema 1</EnlaceBoton>
        <section>
          <h2 className="mb-6 text-center font-serif text-2xl font-semibold">Camino</h2>
          <Camino temas={temasVista} premium={false} puedeLeccion />
        </section>
      </div>
    </>
  );
}
