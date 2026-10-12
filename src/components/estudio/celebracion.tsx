import { Award, Flame, Zap } from "lucide-react";
import { frasesCelebracion, hayCelebracion, type MetaSesion } from "@/lib/estudio/celebracion";
import { NOMBRES_LOGRO } from "@/lib/estudio/logros";

/** Lo que has ganado en la sesión: XP, racha y logros. */
export function Celebracion({ meta }: { meta: MetaSesion | null | undefined }) {
  const frases = frasesCelebracion(meta);
  const logros = (meta?.logros ?? []).map((id) => NOMBRES_LOGRO[id] ?? id);
  if (frases.length === 0 && logros.length === 0 && !meta?.xp) return null;
  const fiesta = hayCelebracion(meta);

  return (
    <section
      className={`relative overflow-hidden rounded-[1.25rem] border p-5 ${fiesta ? "border-subrayador/60 bg-oro-suave" : "border-filete bg-superficie"}`}
      role="status"
    >
      {fiesta && (
        <div className="confeti" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} style={{ left: `${4 + i * 7}%`, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="cifras inline-flex items-center gap-1 rounded-full bg-superficie px-3 py-1 text-sm font-extrabold text-oro-texto shadow-tarjeta">
          <Zap aria-hidden size={15} /> +{meta?.xp ?? 0} XP
        </span>
        {meta?.racha_nueva && meta.racha ? (
          <span className="cifras inline-flex items-center gap-1 rounded-full bg-superficie px-3 py-1 text-sm font-extrabold text-teja shadow-tarjeta">
            <Flame aria-hidden size={15} /> {meta.racha} {meta.racha === 1 ? "día" : "días"}
          </span>
        ) : null}
      </div>
      {frases.map((f) => (
        <p key={f} className="mt-3 font-serif text-xl leading-snug font-semibold">
          {f}
        </p>
      ))}
      {logros.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {logros.map((nombre) => (
            <li key={nombre} className="flex items-center gap-2 font-semibold">
              <Award aria-hidden size={18} className="text-oro-texto" /> Logro: {nombre}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
