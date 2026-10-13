import { EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { ClaraDice } from "@/components/mascota/bocadillo";

export default function NoEncontrada() {
  return (
    <>
      <Cabecera />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-12 pb-16">
        <h1 className="sr-only">Página no encontrada</h1>
        <ClaraDice pose="piensa" tamano="size-28">
          <span className="block font-display text-lg font-black">Vaya, esta página no existe.</span>
          <span className="font-semibold">Puede que el enlace esté mal escrito o que la hayamos movido.</span>
        </ClaraDice>
        <EnlaceBoton href="/" ancho>
          Volver al inicio
        </EnlaceBoton>
      </main>
    </>
  );
}
