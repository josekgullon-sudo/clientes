import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";

export default function Inicio() {
  return (
    <>
      <Cabecera />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="max-w-lectura font-serif text-[2rem] leading-tight font-semibold">
          Aprueba el Auxiliar Administrativo del Estado.
        </h1>
      </main>
      <Pie />
    </>
  );
}
