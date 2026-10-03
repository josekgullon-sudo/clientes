import type { ReactNode } from "react";
import { ReglaProgreso } from "@/components/regla-progreso";
import type { Resultado } from "@/lib/test/tipos";

const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

function mensaje(r: Resultado) {
  const p = r.total ? r.aciertos / r.total : 0;
  if (p >= 0.8) return "Muy bien. Lo llevas preparado.";
  if (p >= 0.6) return "Vas bien. Repasa lo que has fallado y lo tendrás.";
  if (p >= 0.4) return "Buen punto de partida. La corrección te dice qué repasar.";
  return "Cada fallo de hoy es una pregunta que no fallarás en el examen.";
}

/** Resultado de un test: cifra principal, desglose y temas que conviene repasar. */
export function Resumen({
  resultado,
  penalizacion,
  estados,
  temas,
  acciones,
}: {
  resultado: Resultado;
  penalizacion: number;
  estados: ("acierto" | "fallo" | "pendiente")[];
  temas: { etiqueta: string; total: number; aciertos: number }[];
  acciones: ReactNode;
}) {
  const r = resultado;
  return (
    <section aria-labelledby="titulo-resumen" className="mx-auto w-full max-w-lectura px-4 pt-8">
      <p className="text-[0.95rem] text-pizarra">Resultado</p>
      <h1 id="titulo-resumen" className="font-serif text-[2.25rem] leading-tight font-semibold">
        {r.aciertos} de {r.total} <span className="text-[1.25rem] font-normal">aciertos</span>
      </h1>
      <p className="mt-2 font-serif text-[1.125rem]">{mensaje(r)}</p>

      <div className="mt-5">
        <ReglaProgreso total={estados.length} actual={-1} estados={estados} />
      </div>

      <dl className="mt-5 grid grid-cols-3 border-y border-filete text-center">
        <div className="py-3">
          <dt className="text-[0.9rem] text-pizarra">Aciertos</dt>
          <dd className="text-xl font-semibold text-pino">{r.aciertos}</dd>
        </div>
        <div className="border-x border-filete py-3">
          <dt className="text-[0.9rem] text-pizarra">Fallos</dt>
          <dd className="text-xl font-semibold text-teja">{r.fallos}</dd>
        </div>
        <div className="py-3">
          <dt className="text-[0.9rem] text-pizarra">En blanco</dt>
          <dd className="text-xl font-semibold">{r.enBlanco}</dd>
        </div>
      </dl>

      {penalizacion > 0 && (
        <p className="mt-3 text-[0.95rem] text-pizarra">
          Nota con penalización: <strong className="text-tinta">{nf.format(r.nota)} sobre 10</strong>.
          Cada fallo resta {penalizacion > 0.33 && penalizacion < 0.34 ? "un tercio" : nf.format(penalizacion)} de
          acierto.
        </p>
      )}

      {temas.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold">Para repasar</h2>
          <ul className="mt-2">
            {temas.slice(0, 5).map((t) => (
              <li key={t.etiqueta} className="flex items-baseline justify-between gap-4 border-b border-filete py-3">
                <span className="line-clamp-2">{t.etiqueta}</span>
                <span className="shrink-0 text-[0.95rem] text-pizarra">
                  {t.aciertos}/{t.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2">{acciones}</div>
    </section>
  );
}
