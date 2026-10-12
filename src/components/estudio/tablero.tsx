import { Calendar, Flame, Target, Zap } from "lucide-react";
import { Anillo } from "./anillo";

export function Tablero({
  racha,
  protectores,
  hecho,
  objetivo,
  xp,
  dias,
}: {
  racha: number;
  protectores?: number;
  hecho: number;
  objetivo: number;
  xp?: number;
  dias?: number | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <article className="tarjeta col-span-2 flex items-center gap-4 p-5">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-teja-suave text-teja">
          <Flame className="llama" aria-hidden size={28} />
        </span>
        <div>
          <p className="text-sm font-medium text-pizarra">Racha</p>
          <p className="font-serif text-4xl leading-none font-semibold">{racha}</p>
          <p className="mt-1 text-sm text-pizarra">
            {racha === 1 ? "día" : "días"}
            {protectores ? ` · ${protectores} ${protectores === 1 ? "protector" : "protectores"}` : ""}
          </p>
        </div>
      </article>
      <article className="tarjeta flex items-center gap-3 p-4">
        <Anillo hecho={hecho} objetivo={objetivo} />
        <div>
          <p className="flex items-center gap-1 text-sm font-medium text-pizarra">
            <Target aria-hidden size={14} /> Hoy
          </p>
          <p className="font-serif text-2xl font-semibold">
            {hecho}<span className="text-base font-normal text-pizarra">/{objetivo}</span>
          </p>
        </div>
      </article>
      <article className="tarjeta flex flex-col justify-center gap-1 p-4">
        <p className="flex items-center gap-1 text-sm font-medium text-pizarra">
          <Zap aria-hidden size={14} /> XP
        </p>
        <p className="font-serif text-2xl font-semibold">{xp ?? 0}</p>
      </article>
      {dias !== null && dias !== undefined && (
        <article className="tarjeta flex flex-col justify-center gap-1 p-4">
          <p className="flex items-center gap-1 text-sm font-medium text-pizarra">
            <Calendar aria-hidden size={14} /> Examen
          </p>
          <p className="font-serif text-2xl font-semibold">{Math.max(0, dias)}<span className="ml-1 font-sans text-sm font-normal text-pizarra">días</span></p>
        </article>
      )}
    </div>
  );
}
