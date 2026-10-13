import { Award, Crown, Flame, TrendingUp } from "lucide-react";
import { frasesCelebracion, type MetaSesion } from "@/lib/estudio/celebracion";
import { NOMBRES_LOGRO } from "@/lib/estudio/logros";

/**
 * Lo que ha pasado en la sesión, además de la nota: racha, nivel, corona y logros.
 * La XP ya va en las fichas del resultado.
 */
export function Celebracion({ meta }: { meta: MetaSesion | null | undefined }) {
  if (!meta) return null;
  const logros = (meta.logros ?? []).map((id) => NOMBRES_LOGRO[id] ?? id);
  const frases = frasesCelebracion(meta).filter((f) => !f.startsWith("Racha de"));
  const racha = meta.racha_nueva && meta.racha ? meta.racha : null;
  if (!racha && frases.length === 0 && logros.length === 0) return null;

  return (
    <div className="flex flex-col gap-3" role="status">
      {racha && (
        <div className="rebote flex items-center gap-4 rounded-[1.25rem] border-2 border-naranja/50 bg-naranja-suave p-4">
          <span className="relative grid size-16 shrink-0 place-items-center">
            <Flame aria-hidden className="llama size-16 fill-naranja text-naranja" strokeWidth={1.5} />
            <span className="cifras absolute bottom-1.5 font-display text-lg font-black text-white">{racha}</span>
          </span>
          <div>
            <p className="font-display text-xl leading-tight font-black text-naranja-texto">
              ¡{racha} {racha === 1 ? "día" : "días"} de racha!
            </p>
            <p className="text-sm font-semibold text-naranja-texto">
              {racha === 1 ? "Has empezado tu racha. Vuelve mañana para que crezca." : "Sigue así: vuelve mañana para no perderla."}
            </p>
          </div>
        </div>
      )}
      {frases.map((f) => (
        <p key={f} className="rebote flex items-center gap-3 rounded-[1.25rem] border-2 border-pino-vivo/50 bg-pino-suave p-4 font-bold text-pino">
          {f.startsWith("Corona") ? <Crown aria-hidden size={22} /> : <TrendingUp aria-hidden size={22} />}
          {f}
        </p>
      ))}
      {logros.map((nombre) => (
        <p key={nombre} className="rebote flex items-center gap-3 rounded-[1.25rem] border-2 border-subrayador/60 bg-oro-suave p-4 font-bold text-oro-texto">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-subrayador text-subrayador-texto">
            <Award aria-hidden size={20} />
          </span>
          <span>
            <span className="block text-xs font-black tracking-wider uppercase">Logro desbloqueado</span>
            {nombre}
          </span>
        </p>
      ))}
    </div>
  );
}
