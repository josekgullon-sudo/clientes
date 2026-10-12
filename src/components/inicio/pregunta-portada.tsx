"use client";

import { ArrowRight, BookOpen, Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { EnlaceBoton } from "@/components/boton";
import { Cita } from "@/components/cita";
import { evento } from "@/components/evento";
import { LETRAS, type PreguntaTest } from "@/lib/test/tipos";

/**
 * Una pregunta real que se responde en la propia portada: el producto en diez segundos.
 * Al responder enseña la corrección con su artículo y lleva al test de diez.
 */
export function PreguntaPortada({ preguntas }: { preguntas: PreguntaTest[] }) {
  const [n, setN] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const p = preguntas[n % preguntas.length];
  if (!p) return null;
  const respondida = elegida !== null;
  const acierto = elegida === p.correcta;

  function elegir(i: number) {
    if (respondida) return;
    setElegida(i);
    evento("home_pregunta", { acierto: i === p.correcta ? 1 : 0 });
  }

  return (
    <div className="tarjeta overflow-hidden shadow-alta">
      <div className="flex items-center justify-between gap-3 border-b border-filete px-5 py-3">
        <p className="text-sm font-bold text-pino">Pruébalo ahora</p>
        {p.ley && <span className="shrink-0 rounded-full bg-papel-hundido px-2.5 py-0.5 text-xs font-bold text-pizarra">{p.ley}</span>}
      </div>

      <div className="p-5">
        <p className="font-serif text-[1.1875rem] leading-snug font-medium" id={`portada-${p.id}`}>
          {p.enunciado}
        </p>

        <div className="mt-4 flex flex-col gap-2" role="group" aria-labelledby={`portada-${p.id}`}>
          {p.opciones.map((texto, i) => {
            const correcta = respondida && i === p.correcta;
            const fallada = respondida && i === elegida && !acierto;
            return (
              <button
                key={`${p.id}-${i}`}
                type="button"
                onClick={() => elegir(i)}
                disabled={respondida}
                aria-pressed={elegida === i}
                className={`flex min-h-13 items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 text-left font-medium transition ${
                  correcta
                    ? "opcion-ok border-pino bg-pino-suave"
                    : fallada
                      ? "opcion-mal border-teja bg-teja-suave"
                      : respondida
                        ? "border-filete opacity-60"
                        : "border-filete bg-superficie hover:border-pino/50 hover:bg-pino-suave/40 active:scale-[0.99]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 text-xs font-extrabold ${
                    correcta
                      ? "border-pino bg-pino-boton text-sobre-pino"
                      : fallada
                        ? "border-teja bg-teja text-superficie"
                        : "border-filete text-pizarra"
                  }`}
                >
                  {correcta ? <Check size={15} strokeWidth={3} /> : fallada ? <X size={15} strokeWidth={3} /> : LETRAS[i]}
                </span>
                <span className="flex-1 leading-snug">{texto}</span>
              </button>
            );
          })}
        </div>

        <div aria-live="polite">
          {respondida && (
            <div className="aparecer mt-4">
              <p className={`flex items-center gap-2 font-extrabold ${acierto ? "text-pino" : "text-teja"}`}>
                <span
                  aria-hidden="true"
                  className={`grid size-6 place-items-center rounded-full text-superficie ${acierto ? "bg-pino" : "bg-teja"}`}
                >
                  {acierto ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                </span>
                {acierto ? "¡Correcto! Y ahora sabes por qué:" : `Casi. La correcta es la ${LETRAS[p.correcta]}, y este es el porqué:`}
              </p>
              <div className="mt-3 rounded-2xl bg-papel p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-pizarra">
                  <BookOpen aria-hidden size={13} /> Explicación
                </p>
                <p className={`mt-2 border-l-[3px] pl-3 font-serif text-[0.975rem] leading-relaxed ${acierto ? "border-pino" : "border-teja"}`}>
                  {p.explicacion}
                </p>
                <p className="mt-3">
                  <Cita articulo={p.articulo} ley={p.ley ?? "Documentación oficial"} />
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <EnlaceBoton href="/demo" ancho className="sm:flex-1">
                  Haz el test de 10 <ArrowRight aria-hidden size={18} />
                </EnlaceBoton>
                {preguntas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setElegida(null);
                      setN((x) => x + 1);
                    }}
                    className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl px-4 font-bold text-pino hover:bg-pino-suave"
                  >
                    <RotateCcw aria-hidden size={16} /> Otra pregunta
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
