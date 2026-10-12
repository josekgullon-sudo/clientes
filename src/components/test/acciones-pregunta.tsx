"use client";

import { useState, useTransition } from "react";
import { marcarRepaso, reportarPregunta } from "@/app/app/acciones";

export function AccionesPregunta({ preguntaId, fallo }: { preguntaId: string; fallo: boolean }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [pendiente, iniciar] = useTransition();

  return (
    <div className="mt-3 flex flex-col gap-2">
      {fallo && (
        <button
          type="button"
          className="min-h-11 self-start font-semibold underline underline-offset-4 disabled:opacity-50"
          disabled={pendiente}
          onClick={() =>
            iniciar(async () => {
              const r = await marcarRepaso(preguntaId);
              setAviso(r && "error" in r ? "No se ha podido guardar el repaso." : "Queda en el repaso de hoy.");
            })
          }
        >
          Repasar esta
        </button>
      )}
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          iniciar(async () => {
            const r = await reportarPregunta(preguntaId, motivo);
            setAviso(r && "error" in r ? "No se ha enviado el aviso." : "Aviso enviado. Gracias.");
            if (r && "ok" in r) setMotivo("");
          });
        }}
      >
        <label className="sr-only" htmlFor={`reporte-${preguntaId}`}>Avisar de un error en la pregunta</label>
        <input
          id={`reporte-${preguntaId}`}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={500}
          placeholder="¿Hay un error en esta pregunta?"
          className="min-h-11 flex-1 rounded-md border border-filete bg-papel px-3"
        />
        <button type="submit" className="min-h-11 px-2 font-semibold underline underline-offset-4" disabled={pendiente || motivo.trim().length < 4}>
          Avisar
        </button>
      </form>
      {aviso && <p role="status" className="text-[0.95rem] text-pizarra">{aviso}</p>}
    </div>
  );
}
