import { CaminoJuego } from "@/components/estudio/camino-juego";
import { temasVista } from "../datos";

export default function VistaCamino() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-8 pb-16">
      <CaminoJuego temas={temasVista} premium={false} puedeLeccion />
    </div>
  );
}
