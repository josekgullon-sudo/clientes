import { frasesCelebracion, hayCelebracion, type MetaSesion } from "@/lib/estudio/celebracion";
import { NOMBRES_LOGRO } from "@/lib/estudio/logros";

export function Celebracion({ meta }: { meta: MetaSesion | null | undefined }) {
  const frases = frasesCelebracion(meta);
  const logros = (meta?.logros ?? []).map((id) => NOMBRES_LOGRO[id] ?? id);
  if (frases.length === 0 && logros.length === 0 && !meta?.xp) return null;
  const fiesta = hayCelebracion(meta);

  return (
    <section className={`relative overflow-hidden rounded-2xl border p-4 ${fiesta ? "border-pino bg-pino-suave" : "border-filete"}`} role="status">
      {fiesta && (
        <div className="confeti" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} style={{ left: `${6 + i * 8}%`, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      )}
      <p className="text-[0.95rem] font-semibold text-pino">+{meta?.xp ?? 0} XP</p>
      {frases.map((f) => (
        <p key={f} className="mt-1 font-serif text-xl font-semibold">{f}</p>
      ))}
      {logros.length > 0 && (
        <ul className="mt-2">
          {logros.map((nombre) => (
            <li key={nombre}>Logro: {nombre}</li>
          ))}
        </ul>
      )}
      {meta?.racha_nueva && meta.racha ? (
        <p className="mt-1 text-[0.95rem] text-pizarra">Racha actual: {meta.racha} {meta.racha === 1 ? "día" : "días"}.</p>
      ) : null}
    </section>
  );
}
