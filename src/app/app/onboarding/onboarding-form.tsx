"use client";

import { useState } from "react";
import { Boton } from "@/components/boton";
import { guardarAjustes } from "../ajustes";

const opciones = [5, 10, 20];

export function OnboardingForm({ temaId, temaNombre }: { temaId: string | null; temaNombre: string | null }) {
  const [paso, setPaso] = useState(1);
  const [fecha, setFecha] = useState("");
  const [objetivo, setObjetivo] = useState(10);
  const [sinFecha, setSinFecha] = useState(false);

  return (
    <div className="max-w-lectura">
      <p className="text-[0.95rem] font-semibold text-pizarra">Paso {paso} de 3</p>
      {paso === 1 && (
        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPaso(2);
          }}
        >
          <h1 className="font-serif text-3xl font-semibold">¿Cuándo es el examen?</h1>
          <p className="text-pizarra">Puedes cambiarla después.</p>
          <label className="font-semibold" htmlFor="fecha">Fecha</label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            disabled={sinFecha}
            onChange={(e) => setFecha(e.target.value)}
            className="min-h-14 rounded-md border border-pizarra/70 bg-papel px-4 disabled:opacity-50"
          />
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" checked={sinFecha} onChange={(e) => setSinFecha(e.target.checked)} className="size-5" />
            Aún no lo sé
          </label>
          <Boton type="submit">Seguir</Boton>
        </form>
      )}

      {paso === 2 && (
        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPaso(3);
          }}
        >
          <h1 className="font-serif text-[2rem] leading-tight font-semibold">¿Cuántas preguntas al día?</h1>
          <p>El día cuenta para la racha cuando llegas a este número. Diez son unos cinco minutos.</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Objetivo diario">
            {opciones.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={objetivo === n}
                onClick={() => setObjetivo(n)}
                className={`min-h-14 rounded-md border font-semibold ${objetivo === n ? "border-tinta bg-tinta text-papel" : "border-filete"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <Boton type="submit">Seguir</Boton>
        </form>
      )}

      {paso === 3 && (
        <form action={guardarAjustes} className="mt-4 flex flex-col gap-4">
          <h1 className="font-serif text-[2rem] leading-tight font-semibold">Un test corto para situarte</h1>
          <p>
            {temaNombre
              ? `Diez preguntas de ${temaNombre}. Así el camino y la predicción tienen por dónde empezar.`
              : "Cuando haya preguntas en tu siguiente tema, el test de diez aparecerá aquí."}
          </p>
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
          <Boton type="submit" name="empezar" value="0" variante="secundario">
            Ahora no
          </Boton>
        </form>
      )}
    </div>
  );
}
