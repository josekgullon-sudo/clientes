import type { ReactNode } from "react";
import { Flame } from "lucide-react";

/** Tarjeta del test de hoy: hecho o pendiente, y la racha al lado. */
export function TarjetaTestHoy({
  hecho,
  racha,
  accion,
}: {
  hecho: boolean;
  racha: number;
  accion: ReactNode;
}) {
  return (
    <section aria-labelledby="test-hoy" className="overflow-hidden rounded-[1.25rem] border-2 border-pino-vivo bg-pino-suave">
      <div className="flex items-center gap-4 p-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-pino-boton text-sobre-pino">
          <Flame aria-hidden size={28} className="fill-current" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="test-hoy" className="font-display text-xl leading-tight font-black">
            Test de hoy
          </h2>
          <p className="text-sm font-semibold text-pizarra">10 preguntas · cuenta para tu racha</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-black ${hecho ? "text-pino" : "text-naranja-texto"}`}>{hecho ? "Hecho" : "Pendiente"}</p>
          <p className="cifras text-sm font-extrabold">{racha} {racha === 1 ? "día" : "días"}</p>
        </div>
      </div>
      {accion ? <div className="px-4 pb-4">{accion}</div> : <div className="h-1" />}
    </section>
  );
}
