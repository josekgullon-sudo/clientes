import { CalendarDays, Flame, Shield, Zap } from "lucide-react";
import { Anillo } from "./anillo";

function mensajeObjetivo(hecho: number, objetivo: number, racha: number) {
  const faltan = Math.max(0, objetivo - hecho);
  if (objetivo > 0 && faltan === 0) return "Objetivo cumplido. Tu racha está a salvo.";
  if (hecho === 0) return racha > 0 ? `Haz ${objetivo} preguntas para seguir la racha.` : `Haz ${objetivo} preguntas para empezar tu racha.`;
  return `Te ${faltan === 1 ? "falta 1 pregunta" : `faltan ${faltan} preguntas`} para el objetivo.`;
}

/** Resumen del día: objetivo con anillo y, debajo, racha, XP y días al examen. */
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
  const datos = [
    {
      icono: Flame,
      color: "text-teja",
      valor: racha,
      etiqueta: racha === 1 ? "día de racha" : "días de racha",
      extra: protectores ? (
        <span className="inline-flex items-center gap-0.5" title="Protectores de racha">
          <Shield aria-hidden size={12} /> {protectores}
        </span>
      ) : null,
    },
    { icono: Zap, color: "text-oro-texto", valor: xp ?? 0, etiqueta: "XP total", extra: null },
    ...(dias !== null && dias !== undefined
      ? [{ icono: CalendarDays, color: "text-pino", valor: Math.max(0, dias), etiqueta: "días al examen", extra: null }]
      : []),
  ];

  return (
    <section aria-label="Tu día" className="tarjeta overflow-hidden">
      <div className="flex items-center gap-5 p-5">
        <Anillo hecho={hecho} objetivo={objetivo} />
        <div className="min-w-0">
          <p className="antetitulo">Objetivo de hoy</p>
          <p className="cifras mt-1 text-2xl font-extrabold">
            {Math.min(hecho, objetivo)} <span className="text-base font-semibold text-pizarra">de {objetivo} preguntas</span>
          </p>
          <p className="mt-1 text-[0.95rem] text-pizarra">{mensajeObjetivo(hecho, objetivo, racha)}</p>
        </div>
      </div>
      <dl className={`grid border-t border-filete ${datos.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {datos.map((d, i) => (
          <div key={d.etiqueta} className={`flex flex-col-reverse items-center gap-0.5 px-2 py-3 text-center ${i > 0 ? "border-l border-filete" : ""}`}>
            <dt className="flex items-center gap-1 text-xs font-semibold text-pizarra">
              {d.etiqueta} {d.extra}
            </dt>
            <dd className="cifras flex items-center gap-1.5 text-xl font-extrabold">
              <d.icono aria-hidden size={18} className={`${d.color} ${d.icono === Flame && racha > 0 ? "llama" : ""}`} />
              {d.valor}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
