import { Clara } from "@/components/mascota/clara";

export default function Cargando() {
  return (
    <div className="grid min-h-dvh place-items-center px-4" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-center">
        <Clara pose="piensa" className="size-28" />
        <p className="font-display text-xl font-black">Preparando tus preguntas…</p>
      </div>
    </div>
  );
}
