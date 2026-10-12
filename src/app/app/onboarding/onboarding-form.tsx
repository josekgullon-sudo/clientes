"use client";

import { ArrowLeft, CalendarDays, CircleHelp } from "lucide-react";
import { useState } from "react";
import { Boton } from "@/components/boton";
import { guardarAjustes } from "../ajustes";

const opciones = [
  { n: 5, titulo: "Suave", texto: "Unos 3 minutos al día" },
  { n: 10, titulo: "Constante", texto: "Unos 5 minutos. Lo más elegido" },
  { n: 20, titulo: "Intenso", texto: "Unos 10 minutos al día" },
];

function Pasos({ paso }: { paso: number }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-label={`Paso ${paso} de 3`} aria-valuemin={1} aria-valuemax={3} aria-valuenow={paso}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-2 flex-1 rounded-full transition ${n <= paso ? "bg-pino" : "bg-papel-hundido"}`} />
      ))}
    </div>
  );
}

export function OnboardingForm({
  temaId,
  tema,
}: {
  temaId: string | null;
  tema: { numero: number; titulo: string } | null;
}) {
  const [paso, setPaso] = useState(1);
  const [fecha, setFecha] = useState("");
  const [objetivo, setObjetivo] = useState(10);
  const [sinFecha, setSinFecha] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {paso > 1 && (
          <button
            type="button"
            onClick={() => setPaso((p) => p - 1)}
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-xl text-pizarra hover:bg-papel-hundido"
            aria-label="Paso anterior"
          >
            <ArrowLeft aria-hidden size={22} />
          </button>
        )}
        <div className="flex-1">
          <Pasos paso={paso} />
        </div>
      </div>

      {paso === 1 && (
        <form
          className="aparecer flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            setPaso(2);
          }}
        >
          <div>
            <h1 className="font-serif text-[2rem] leading-tight font-semibold">¿Cuándo es tu examen?</h1>
            <p className="mt-2 text-pizarra">Con la fecha calculamos tu ritmo. Puedes cambiarla cuando quieras.</p>
          </div>
          <label
            className={`tarjeta flex cursor-pointer items-center gap-4 border-2 p-4 transition ${!sinFecha ? "border-pino" : ""}`}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-pino-suave text-pino">
              <CalendarDays aria-hidden size={22} />
            </span>
            <span className="flex-1">
              <span className="block font-bold">Ya sé la fecha</span>
              <input
                type="date"
                aria-label="Fecha del examen"
                value={fecha}
                onFocus={() => setSinFecha(false)}
                onChange={(e) => {
                  setFecha(e.target.value);
                  setSinFecha(false);
                }}
                className="mt-2 min-h-12 w-full rounded-xl border border-filete bg-papel px-3"
              />
            </span>
          </label>
          <button
            type="button"
            aria-pressed={sinFecha}
            onClick={() => setSinFecha(true)}
            className={`tarjeta flex items-center gap-4 border-2 p-4 text-left transition ${sinFecha ? "border-pino" : ""}`}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-papel-hundido text-pizarra">
              <CircleHelp aria-hidden size={22} />
            </span>
            <span>
              <span className="block font-bold">Aún no lo sé</span>
              <span className="text-sm text-pizarra">Usamos la fecha estimada de la próxima convocatoria.</span>
            </span>
          </button>
          <Boton type="submit" disabled={!sinFecha && !fecha}>
            Seguir
          </Boton>
        </form>
      )}

      {paso === 2 && (
        <form
          className="aparecer flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            setPaso(3);
          }}
        >
          <div>
            <h1 className="font-serif text-[2rem] leading-tight font-semibold">¿Cuánto quieres estudiar al día?</h1>
            <p className="mt-2 text-pizarra">El día cuenta para tu racha al llegar a este número.</p>
          </div>
          <div className="flex flex-col gap-3" role="radiogroup" aria-label="Preguntas al día">
            {opciones.map((o) => (
              <button
                key={o.n}
                type="button"
                role="radio"
                aria-checked={objetivo === o.n}
                onClick={() => setObjetivo(o.n)}
                className={`tarjeta flex items-center gap-4 border-2 p-4 text-left transition ${objetivo === o.n ? "border-pino bg-pino-suave" : ""}`}
              >
                <span className="cifras grid size-12 shrink-0 place-items-center rounded-xl bg-superficie text-xl font-extrabold shadow-tarjeta">
                  {o.n}
                </span>
                <span>
                  <span className="block font-bold">{o.titulo}</span>
                  <span className="text-sm text-pizarra">
                    {o.n} preguntas · {o.texto}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <Boton type="submit">Seguir</Boton>
        </form>
      )}

      {paso === 3 && (
        <form action={guardarAjustes} className="aparecer flex flex-col gap-5">
          <div>
            <h1 className="font-serif text-[2rem] leading-tight font-semibold">Empieza con un test corto</h1>
            <p className="mt-2 text-pizarra">
              {tema
                ? "Diez preguntas para situarte. Así el camino y la predicción tienen por dónde empezar."
                : "Cuando haya preguntas en tu primer tema, el test aparecerá aquí."}
            </p>
          </div>
          {tema && (
            <div className="tarjeta overflow-hidden">
              <div className="bg-pino-boton px-5 py-4 text-sobre-pino">
                <p className="text-[0.8125rem] font-bold tracking-wide uppercase opacity-85">Tema {tema.numero}</p>
                <p className="mt-1 font-serif text-xl leading-snug font-semibold">{tema.titulo}</p>
              </div>
              <p className="px-5 py-3 text-sm text-pizarra">10 preguntas · unos 5 minutos · con la explicación de cada una</p>
            </div>
          )}
          <input type="hidden" name="objetivo" value={objetivo} />
          <input type="hidden" name="fecha" value={sinFecha ? "" : fecha} />
          <input type="hidden" name="completar" value="1" />
          <input type="hidden" name="recordatorio" value="1" />
          {temaId && <input type="hidden" name="tema" value={temaId} />}
          {temaId && (
            <Boton type="submit" name="empezar" value="1">
              Hacer 10 preguntas
            </Boton>
          )}
          <Boton type="submit" name="empezar" value="0" variante={temaId ? "texto" : "principal"}>
            {temaId ? "Ahora no, ir a mi panel" : "Ir a mi panel"}
          </Boton>
        </form>
      )}
    </div>
  );
}
