"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { LETRAS, type PreguntaTest } from "@/lib/test/tipos";
import { AccionesPregunta } from "./acciones-pregunta";
import { Explicacion } from "./explicacion";

const estados = {
  acierto: { texto: "Acierto", clase: "bg-pino-suave text-pino" },
  fallo: { texto: "Fallo", clase: "bg-teja-suave text-teja" },
  blanco: { texto: "En blanco", clase: "bg-papel-hundido text-pizarra" },
};

/** Corrección completa: cada pregunta con tu respuesta, la correcta y la explicación. */
export function ListaCorreccion({
  preguntas,
  respuestas,
  puedeGuardar = false,
}: {
  preguntas: PreguntaTest[];
  respuestas: Record<string, number | null>;
  puedeGuardar?: boolean;
}) {
  const fallos = preguntas.filter((p) => respuestas[p.id] !== p.correcta).length;
  const [soloFallos, setSoloFallos] = useState(fallos > 0);
  const visibles = preguntas
    .map((p, n) => ({ p, n }))
    .filter(({ p }) => !soloFallos || respuestas[p.id] !== p.correcta);

  return (
    <section aria-labelledby="titulo-correccion" className="mx-auto w-full max-w-lectura px-4 pt-10 pb-24">
      <h2 id="titulo-correccion" className="font-serif text-2xl font-semibold">
        Corrección
      </h2>
      <div role="group" aria-label="Filtrar preguntas" className="mt-4 inline-flex rounded-2xl bg-papel-hundido p-1">
        {[
          { valor: true, texto: `Fallos y en blanco · ${fallos}` },
          { valor: false, texto: `Todas · ${preguntas.length}` },
        ].map((f) => (
          <button
            key={String(f.valor)}
            type="button"
            aria-pressed={soloFallos === f.valor}
            onClick={() => setSoloFallos(f.valor)}
            className="cifras min-h-11 rounded-xl px-4 text-sm font-bold text-pizarra transition aria-pressed:bg-superficie aria-pressed:text-tinta aria-pressed:shadow-tarjeta"
          >
            {f.texto}
          </button>
        ))}
      </div>

      {visibles.length === 0 && (
        <p className="tarjeta mt-4 p-5 text-center font-semibold">Ningún fallo. Todas correctas.</p>
      )}

      <ol className="mt-4 flex flex-col gap-4">
        {visibles.map(({ p, n }) => {
          const r = respuestas[p.id] ?? null;
          const e = r === null ? estados.blanco : r === p.correcta ? estados.acierto : estados.fallo;
          return (
            <li key={p.id} className="tarjeta p-5">
              <p className="flex items-center justify-between gap-3 text-sm font-semibold text-pizarra">
                <span className="cifras">Pregunta {n + 1}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${e.clase}`}>{e.texto}</span>
              </p>
              <p className="mt-2 font-serif text-[1.0625rem] leading-relaxed font-medium">{p.enunciado}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {p.opciones.map((o, i) => {
                  const correcta = i === p.correcta;
                  const tuya = i === r;
                  return (
                    <li
                      key={i}
                      className={`flex gap-2.5 rounded-xl px-3 py-2 text-[0.975rem] ${
                        correcta ? "bg-pino-suave font-semibold" : tuya ? "bg-teja-suave" : "text-pizarra"
                      }`}
                    >
                      <span className={`w-4 shrink-0 font-extrabold ${correcta ? "text-pino" : tuya ? "text-teja" : ""}`}>{LETRAS[i]}</span>
                      <span className="flex-1">{o}</span>
                      {correcta && <span className="shrink-0 text-xs font-bold text-pino">Correcta</span>}
                      {tuya && !correcta && <span className="shrink-0 text-xs font-bold text-teja">Tu respuesta</span>}
                    </li>
                  );
                })}
              </ul>
              <details className="group mt-4 border-t border-filete pt-3" open={r !== p.correcta}>
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-bold text-pino [&::-webkit-details-marker]:hidden">
                  Explicación
                  <ChevronDown aria-hidden size={18} className="transition group-open:rotate-180" />
                </summary>
                <div className="mt-2">
                  <Explicacion pregunta={p} respuesta={r} titular={false} plana />
                </div>
              </details>
              {puedeGuardar && <AccionesPregunta preguntaId={p.id} fallo={r !== p.correcta} />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
