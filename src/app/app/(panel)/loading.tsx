import { Clara } from "@/components/mascota/clara";

/** Se ve al instante al cambiar de pantalla mientras llegan los datos. */
export default function Cargando() {
  const bloque = "rounded-[1.25rem] bg-papel-hundido motion-safe:animate-pulse";
  return (
    <div className="flex flex-col gap-8" role="status" aria-live="polite">
      <div className="flex items-center gap-4">
        <Clara pose="piensa" className="size-20 shrink-0" />
        <p className="font-display text-lg font-black text-pizarra">Un momento…</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]" aria-hidden="true">
        <div className="flex flex-col gap-6">
          <div className={`h-48 ${bloque}`} />
          <div className={`h-72 ${bloque}`} />
        </div>
        <div className="flex flex-col gap-6">
          <div className={`h-24 ${bloque}`} />
          <div className={`h-40 ${bloque}`} />
        </div>
      </div>
    </div>
  );
}
