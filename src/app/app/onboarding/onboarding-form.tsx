"use client";

import { ArrowLeft, CalendarDays, CircleHelp, Landmark } from "lucide-react";
import { useState } from "react";
import { Boton } from "@/components/boton";
import { ClaraDice } from "@/components/mascota/bocadillo";
import { OPOSICIONES } from "@/lib/sitio";
import { guardarAjustes } from "../ajustes";

const TITULACION: Record<string, string> = {
  C2: "Grupo C2 · título de ESO",
  C1: "Grupo C1 · título de Bachiller o Técnico",
};

const PASOS = 4;

const opciones = [
  { n: 5, titulo: "Suave", texto: "Unos 3 minutos al día", emoji: "🌱" },
  { n: 10, titulo: "Constante", texto: "Unos 5 minutos. Lo más elegido", emoji: "🔥" },
  { n: 20, titulo: "Intenso", texto: "Unos 10 minutos al día", emoji: "🚀" },
];

function Pasos({ paso }: { paso: number }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-label={`Paso ${paso} de ${PASOS}`} aria-valuemin={1} aria-valuemax={PASOS} aria-valuenow={paso}>
      {Array.from({ length: PASOS }, (_, i) => i + 1).map((n) => (
        <span key={n} className={`h-4 flex-1 rounded-full transition ${n <= paso ? "bg-pino-vivo" : "bg-papel-hundido"}`} />
      ))}
    </div>
  );
}

export function OnboardingForm({
  hayPreguntas,
  primeros,
  inicial,
}: {
  hayPreguntas: boolean;
  primeros: Record<string, { numero: number; titulo: string } | null>;
  inicial: string;
}) {
  const [paso, setPaso] = useState(1);
  const [oposicion, setOposicion] = useState(inicial);
  const tema = hayPreguntas ? (primeros[oposicion] ?? null) : null;
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
          <ClaraDice pose="hola" saludoInfinito tamano="size-28">
            <span className="block font-display text-lg font-black">¡Hola! Soy Clara.</span>
            <span className="font-semibold">Te acompaño hasta el examen. Para empezar: ¿qué oposición preparas?</span>
          </ClaraDice>
          <h1 className="sr-only">¿Qué oposición preparas?</h1>
          <div className="flex flex-col gap-3" role="radiogroup" aria-label="Oposición">
            {OPOSICIONES.map((o) => (
              <button
                key={o.slug}
                type="button"
                role="radio"
                aria-checked={oposicion === o.slug}
                onClick={() => setOposicion(o.slug)}
                className={`tarjeta flex items-center gap-4 p-4 text-left transition ${oposicion === o.slug ? "!border-cielo !bg-cielo-suave !shadow-[0_3px_0_var(--cielo)]" : ""}`}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-pino-suave text-pino">
                  <Landmark aria-hidden size={24} />
                </span>
                <span>
                  <span className="block font-extrabold">{o.nombre}</span>
                  <span className="text-sm text-pizarra">{TITULACION[o.grupo]}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="text-sm text-pizarra">Puedes cambiarla cuando quieras desde tu perfil.</p>
          <Boton type="submit">Seguir</Boton>
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
          <ClaraDice pose="piensa" tamano="size-28">
            <span className="block font-display text-lg font-black">¿Cuándo es tu examen?</span>
            <span className="font-semibold">Así calculo tu ritmo hasta ese día.</span>
          </ClaraDice>
          <h1 className="sr-only">¿Cuándo es tu examen?</h1>
          <label
            className={`tarjeta flex cursor-pointer items-center gap-4 p-4 transition ${!sinFecha && fecha ? "!border-cielo !bg-cielo-suave !shadow-[0_3px_0_var(--cielo)]" : ""}`}
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
            className={`tarjeta flex items-center gap-4 p-4 text-left transition ${sinFecha ? "!border-cielo !bg-cielo-suave !shadow-[0_3px_0_var(--cielo)]" : ""}`}
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

      {paso === 3 && (
        <form
          className="aparecer flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            setPaso(4);
          }}
        >
          <ClaraDice pose="piensa" tamano="size-28">
            <span className="block font-display text-lg font-black">¿Cuánto quieres estudiar al día?</span>
            <span className="font-semibold">Al llegar a ese número, el día suma a tu racha.</span>
          </ClaraDice>
          <h1 className="sr-only">¿Cuánto quieres estudiar al día?</h1>
          <div className="flex flex-col gap-3" role="radiogroup" aria-label="Preguntas al día">
            {opciones.map((o) => (
              <button
                key={o.n}
                type="button"
                role="radio"
                aria-checked={objetivo === o.n}
                onClick={() => setObjetivo(o.n)}
                className={`tarjeta flex items-center gap-4 p-4 text-left transition ${objetivo === o.n ? "!border-cielo !bg-cielo-suave !shadow-[0_3px_0_var(--cielo)]" : ""}`}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-papel-hundido text-2xl" aria-hidden="true">
                  {o.emoji}
                </span>
                <span>
                  <span className="block font-extrabold">{o.titulo}</span>
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

      {paso === 4 && (
        <form action={guardarAjustes} className="aparecer flex flex-col gap-5">
          <ClaraDice pose="celebra" tamano="size-28">
            <span className="block font-display text-lg font-black">¡Todo listo!</span>
            <span className="font-semibold">
              {tema
                ? `Tu objetivo: ${objetivo} preguntas al día. ¿Hacemos las primeras 10 para situarte?`
                : "Cuando haya preguntas en tu primer tema, tu primer test aparecerá aquí."}
            </span>
          </ClaraDice>
          <h1 className="sr-only">Empieza con un test corto</h1>
          {tema && (
            <div className="tarjeta overflow-hidden">
              <div className="bg-pino-boton px-5 py-4 text-sobre-pino">
                <p className="text-[0.8125rem] font-bold tracking-wide uppercase opacity-85">Tema {tema.numero}</p>
                <p className="mt-1 font-display text-xl leading-snug font-extrabold">{tema.titulo}</p>
              </div>
              <p className="px-5 py-3 text-sm text-pizarra">10 preguntas · unos 5 minutos · con la explicación de cada una</p>
            </div>
          )}
          <input type="hidden" name="objetivo" value={objetivo} />
          <input type="hidden" name="fecha" value={sinFecha ? "" : fecha} />
          <input type="hidden" name="completar" value="1" />
          <input type="hidden" name="oposicion" value={oposicion} />
          <input type="hidden" name="recordatorio" value="1" />
          {tema && (
            <Boton type="submit" name="empezar" value="1">
              Hacer 10 preguntas
            </Boton>
          )}
          <Boton type="submit" name="empezar" value="0" variante={tema ? "texto" : "principal"}>
            {tema ? "Ahora no, ir a mi panel" : "Ir a mi panel"}
          </Boton>
        </form>
      )}
    </div>
  );
}
