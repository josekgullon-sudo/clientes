"use client";

import { Flag, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { marcarRepaso, reportarPregunta } from "@/app/app/acciones";

export function AccionesPregunta({ preguntaId, fallo }: { preguntaId: string; fallo: boolean }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {fallo && (
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-pino-suave px-3.5 text-sm font-bold text-pino disabled:opacity-50"
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                const r = await marcarRepaso(preguntaId);
                setAviso(r && "error" in r ? "No se ha podido guardar el repaso." : "Queda en tu repaso de hoy.");
              })
            }
          >
            <RotateCcw aria-hidden size={15} /> Repasar esta
          </button>
        )}
        <button
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbierto((a) => !a)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-pizarra hover:bg-papel-hundido"
        >
          <Flag aria-hidden size={14} /> ¿Ves un error?
        </button>
      </div>
      {abierto && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              const r = await reportarPregunta(preguntaId, motivo);
              setAviso(r && "error" in r ? "No se ha enviado el aviso." : "Aviso enviado. Lo revisamos con el BOE. Gracias.");
              if (r && "ok" in r) {
                setMotivo("");
                setAbierto(false);
              }
            });
          }}
        >
          <label className="sr-only" htmlFor={`reporte-${preguntaId}`}>
            Cuéntanos el error de la pregunta
          </label>
          <input
            id={`reporte-${preguntaId}`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={500}
            placeholder="Cuéntanos qué está mal"
            className="min-h-11 flex-1 rounded-xl border border-filete bg-papel px-3"
          />
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-papel-hundido px-4 font-bold disabled:opacity-50"
            disabled={pendiente || motivo.trim().length < 4}
          >
            Enviar
          </button>
        </form>
      )}
      {aviso && (
        <p role="status" className="text-sm font-semibold text-pino">
          {aviso}
        </p>
      )}
    </div>
  );
}
