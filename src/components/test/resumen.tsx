import type { ReactNode } from "react";
import type { Resultado } from "@/lib/test/tipos";

const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

function mensaje(r: Resultado) {
  const p = r.total ? r.aciertos / r.total : 0;
  if (p === 1) return { titulo: "¡Pleno!", texto: "Todas bien. Lo llevas preparado." };
  if (p >= 0.8) return { titulo: "Muy bien", texto: "Lo llevas preparado. Repasa los detalles que se escaparon." };
  if (p >= 0.6) return { titulo: "Vas bien", texto: "Repasa lo que has fallado y lo tendrás." };
  if (p >= 0.4) return { titulo: "Buen punto de partida", texto: "La corrección te dice exactamente qué repasar." };
  return { titulo: "Ya sabes qué repasar", texto: "Cada fallo de hoy es una pregunta que no fallarás en el examen." };
}

/** Porcentaje de aciertos en un anillo grande. */
function AnilloResultado({ aciertos, total }: { aciertos: number; total: number }) {
  const tamano = 148;
  const grosor = 14;
  const radio = (tamano - grosor) / 2;
  const c = 2 * Math.PI * radio;
  const ratio = total ? aciertos / total : 0;
  return (
    <div className="relative grid place-items-center" role="img" aria-label={`${aciertos} de ${total} aciertos`}>
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} aria-hidden="true">
        <circle cx={tamano / 2} cy={tamano / 2} r={radio} fill="none" stroke="var(--teja-suave)" strokeWidth={grosor} />
        {ratio > 0 && (
          <circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            fill="none"
            stroke="var(--pino)"
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeDasharray={`${c * ratio} ${c}`}
            transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
          />
        )}
      </svg>
      <div className="absolute text-center" aria-hidden="true">
        <p className="cifras text-4xl leading-none font-extrabold">{aciertos}</p>
        <p className="mt-1 text-sm font-semibold text-pizarra">de {total}</p>
      </div>
    </div>
  );
}

/** Resultado de un test: cifra principal, desglose y temas que conviene repasar. */
export function Resumen({
  resultado,
  penalizacion,
  temas,
  acciones,
  antes,
}: {
  resultado: Resultado;
  penalizacion: number;
  /** Se ignora; se mantiene por compatibilidad. */
  estados?: ("acierto" | "fallo" | "pendiente")[];
  temas: { etiqueta: string; total: number; aciertos: number }[];
  acciones: ReactNode;
  /** Algo que mostrar encima del resultado (celebración, XP). */
  antes?: ReactNode;
}) {
  const r = resultado;
  const m = mensaje(r);
  return (
    <section aria-labelledby="titulo-resumen" className="mx-auto flex w-full max-w-lectura flex-col gap-6 px-4 pt-6">
      {antes}
      <div className="tarjeta aparecer overflow-hidden text-center">
        <div className="flex flex-col items-center px-5 pt-7 pb-6">
          <AnilloResultado aciertos={r.aciertos} total={r.total} />
          <h1 id="titulo-resumen" className="mt-5 font-serif text-[1.75rem] leading-tight font-semibold">
            {m.titulo}
          </h1>
          <p className="mt-1 max-w-sm text-pizarra">{m.texto}</p>
        </div>
        <dl className="cifras grid grid-cols-3 border-t border-filete">
          {[
            { t: "Aciertos", v: r.aciertos, c: "text-pino" },
            { t: "Fallos", v: r.fallos, c: "text-teja" },
            { t: "En blanco", v: r.enBlanco, c: "text-tinta" },
          ].map((d, i) => (
            <div key={d.t} className={`flex flex-col-reverse py-3 ${i > 0 ? "border-l border-filete" : ""}`}>
              <dt className="text-xs font-semibold text-pizarra">{d.t}</dt>
              <dd className={`text-xl font-extrabold ${d.c}`}>{d.v}</dd>
            </div>
          ))}
        </dl>
        {penalizacion > 0 && (
          <p className="border-t border-filete bg-papel-hundido/60 px-4 py-3 text-sm text-pizarra">
            Nota con penalización: <strong className="cifras text-tinta">{nf.format(r.nota)} sobre 10</strong>. Cada fallo
            resta {penalizacion > 0.33 && penalizacion < 0.34 ? "un tercio" : nf.format(penalizacion)} de acierto.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">{acciones}</div>

      {temas.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold">Para repasar</h2>
          <ul className="tarjeta divide-y divide-filete">
            {temas.slice(0, 5).map((t) => (
              <li key={t.etiqueta} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="line-clamp-2 leading-snug">{t.etiqueta}</span>
                <span className="cifras shrink-0 rounded-full bg-teja-suave px-2.5 py-1 text-sm font-bold text-teja">
                  {t.aciertos}/{t.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
