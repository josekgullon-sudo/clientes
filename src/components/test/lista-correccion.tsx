"use client";

import { useState } from "react";
import { LETRAS, type PreguntaTest } from "@/lib/test/tipos";
import { Explicacion } from "./explicacion";

/** Corrección completa: cada pregunta con tu respuesta, la correcta y la explicación. */
export function ListaCorreccion({
  preguntas,
  respuestas,
}: {
  preguntas: PreguntaTest[];
  respuestas: Record<string, number | null>;
}) {
  const [soloFallos, setSoloFallos] = useState(false);
  const fallos = preguntas.filter((p) => respuestas[p.id] !== p.correcta).length;
  const visibles = preguntas
    .map((p, n) => ({ p, n }))
    .filter(({ p }) => !soloFallos || respuestas[p.id] !== p.correcta);

  return (
    <section aria-labelledby="titulo-correccion" className="mx-auto w-full max-w-lectura px-4 pt-10 pb-16">
      <h2 id="titulo-correccion" className="font-serif text-2xl font-semibold">
        Corrección
      </h2>
      <div role="group" aria-label="Filtrar preguntas" className="mt-3 flex gap-2">
        {[
          { valor: false, texto: `Todas (${preguntas.length})` },
          { valor: true, texto: `Fallos y en blanco (${fallos})` },
        ].map((f) => (
          <button
            key={String(f.valor)}
            type="button"
            aria-pressed={soloFallos === f.valor}
            onClick={() => setSoloFallos(f.valor)}
            className="min-h-11 rounded-md border border-filete px-3 text-[0.95rem] aria-pressed:border-tinta aria-pressed:bg-tinta aria-pressed:text-papel"
          >
            {f.texto}
          </button>
        ))}
      </div>

      <ol className="mt-4">
        {visibles.map(({ p, n }) => {
          const r = respuestas[p.id] ?? null;
          return (
            <li key={p.id} className="border-b border-filete py-6">
              <p className="text-[0.9rem] text-pizarra">
                Pregunta {n + 1}
                {r === null ? " · En blanco" : r === p.correcta ? " · Acierto" : " · Fallo"}
              </p>
              <p className="mt-1 font-serif text-[1.0625rem] leading-relaxed font-medium">{p.enunciado}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {p.opciones.map((o, i) => {
                  const correcta = i === p.correcta;
                  const tuya = i === r;
                  return (
                    <li
                      key={i}
                      className={`flex gap-2 rounded-md px-2 py-1.5 ${
                        correcta ? "bg-pino-suave" : tuya ? "bg-teja-suave" : ""
                      }`}
                    >
                      <span className="w-5 shrink-0 font-bold">{LETRAS[i]}</span>
                      <span className="flex-1">{o}</span>
                      {correcta && <span className="shrink-0 text-[0.9rem] font-semibold text-pino">Correcta</span>}
                      {tuya && !correcta && (
                        <span className="shrink-0 text-[0.9rem] font-semibold text-teja">Tu respuesta</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4">
                <Explicacion pregunta={p} respuesta={r} titular={false} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
