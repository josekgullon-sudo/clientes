"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/boton";
import { ReglaProgreso } from "@/components/regla-progreso";
import {
  type ModoSesion,
  type PreguntaTest,
  type Respuesta,
} from "@/lib/test/tipos";
import { Explicacion } from "./explicacion";
import { Opcion, type EstadoOpcion } from "./opcion";

type Props = {
  preguntas: PreguntaTest[];
  /** estudio: se corrige cada pregunta al momento. examen: corrección al final, con tiempo. */
  modo: ModoSesion;
  minutos?: number | null;
  /** Hora de inicio (ISO) para que el tiempo no se reinicie al recargar. */
  inicio?: string;
  /** Adónde lleva la ✕ de salir. */
  salirA: string;
  /** Si se pasa, guarda en el servidor (que redirige a la corrección). Si no, se llama a `alTerminarLocal`. */
  alTerminar?: (respuestas: Respuesta[]) => Promise<{ error: string } | void>;
  alTerminarLocal?: (respuestas: Map<string, number | null>) => void;
};

export function SesionTest({
  preguntas,
  modo,
  minutos,
  inicio,
  salirA,
  alTerminar,
  alTerminarLocal,
}: Props) {
  const router = useRouter();
  const [indice, setIndice] = useState(0);
  const [elegidas, setElegidas] = useState<Map<string, number | null>>(() => new Map());
  const [comprobadas, setComprobadas] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();
  const tiempos = useRef(new Map<string, number>());
  const desde = useRef(0);
  const titulo = useRef<HTMLHeadingElement>(null);
  const dialogoSalir = useRef<HTMLDialogElement>(null);
  const dialogoTerminar = useRef<HTMLDialogElement>(null);

  const pregunta = preguntas[indice];
  const elegida = elegidas.get(pregunta.id);
  const comprobada = comprobadas.has(pregunta.id);
  const esUltima = indice === preguntas.length - 1;
  const enBlanco = preguntas.filter((p) => (elegidas.get(p.id) ?? null) === null).length;

  // Tiempo dedicado a cada pregunta.
  useEffect(() => {
    desde.current = performance.now();
    const mapa = tiempos.current;
    return () => {
      const id = preguntas[indice].id;
      mapa.set(id, (mapa.get(id) ?? 0) + performance.now() - desde.current);
    };
  }, [indice, preguntas]);

  // Al cambiar de pregunta, el foco va al enunciado para que el lector lo lea.
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    titulo.current?.focus();
  }, [indice]);

  const terminar = useCallback(() => {
    dialogoTerminar.current?.close();
    const id = preguntas[indice].id;
    tiempos.current.set(id, (tiempos.current.get(id) ?? 0) + performance.now() - desde.current);
    desde.current = performance.now();

    if (!alTerminar) {
      alTerminarLocal?.(elegidas);
      return;
    }
    const respuestas: Respuesta[] = preguntas.map((p) => ({
      preguntaId: p.id,
      respuesta: elegidas.get(p.id) ?? null,
      tiempoMs: Math.round(tiempos.current.get(p.id) ?? 0),
    }));
    iniciarEnvio(async () => {
      const r = await alTerminar(respuestas);
      if (r?.error) setError(r.error);
    });
  }, [alTerminar, alTerminarLocal, elegidas, indice, preguntas]);

  function elegir(i: number) {
    if (comprobada || enviando) return;
    setElegidas((m) => new Map(m).set(pregunta.id, i));
  }

  function borrar() {
    setElegidas((m) => new Map(m).set(pregunta.id, null));
  }

  function siguiente() {
    if (esUltima) {
      if (modo === "examen") dialogoTerminar.current?.showModal();
      else terminar();
    } else {
      setIndice((i) => i + 1);
    }
  }

  function accionPrincipal() {
    if (modo === "estudio" && !comprobada) {
      if (elegida === undefined || elegida === null) return;
      setComprobadas((s) => new Set(s).add(pregunta.id));
      return;
    }
    siguiente();
  }

  // Teclado: 1-4 o A-D para elegir, Intro para seguir.
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (dialogoSalir.current?.open || dialogoTerminar.current?.open) return;
      const t = e.key.toLowerCase();
      const i = ["1", "2", "3", "4"].indexOf(t) > -1 ? Number(t) - 1 : ["a", "b", "c", "d"].indexOf(t);
      if (i > -1 && i < pregunta.opciones.length) {
        e.preventDefault();
        elegir(i);
      } else if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        accionPrincipal();
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  function estadoOpcion(i: number): EstadoOpcion {
    if (modo === "estudio" && comprobada) {
      if (i === pregunta.correcta) return "correcta";
      if (i === elegida) return "fallada";
      return "neutra";
    }
    return i === elegida ? "elegida" : "libre";
  }

  const estadosRegla = preguntas.map((p) => {
    if (modo === "estudio" && comprobadas.has(p.id)) {
      return elegidas.get(p.id) === p.correcta ? ("acierto" as const) : ("fallo" as const);
    }
    return (elegidas.get(p.id) ?? null) !== null ? ("respondida" as const) : ("pendiente" as const);
  });

  const textoPrincipal =
    modo === "estudio" && !comprobada
      ? "Comprobar"
      : esUltima
        ? modo === "examen"
          ? "Terminar"
          : "Ver resultado"
        : "Siguiente";
  const principalDesactivado =
    enviando || (modo === "estudio" && !comprobada && (elegida === undefined || elegida === null));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-filete bg-papel">
        <div className="mx-auto flex h-12 max-w-lectura items-center justify-between px-2">
          <button
            type="button"
            onClick={() => dialogoSalir.current?.showModal()}
            className="inline-flex size-11 items-center justify-center text-2xl text-pizarra hover:text-tinta"
            aria-label="Salir del test"
          >
            ×
          </button>
          <p className="text-[0.95rem] font-semibold" aria-live="polite">
            {indice + 1} de {preguntas.length}
          </p>
          <div className="flex w-16 justify-end pr-2">
            {modo === "examen" && minutos ? (
              <Cronometro minutos={minutos} inicio={inicio} alAcabar={terminar} />
            ) : null}
          </div>
        </div>
        <div className="mx-auto max-w-lectura px-4 pb-2">
          <ReglaProgreso total={preguntas.length} actual={indice} estados={estadosRegla} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lectura flex-1 px-4 pt-5 pb-36">
        {(pregunta.tema || pregunta.ley) && (
          <p className="mb-2 text-[0.9rem] text-pizarra">
            {[pregunta.tema && `Tema ${pregunta.tema.numero}`, pregunta.ley].filter(Boolean).join(" · ")}
          </p>
        )}
        <h1
          ref={titulo}
          tabIndex={-1}
          id={`enunciado-${pregunta.id}`}
          className="font-serif text-[1.125rem] leading-relaxed font-medium focus:outline-none focus-visible:shadow-none focus-visible:outline-none"
        >
          {pregunta.enunciado}
        </h1>

        <fieldset className="mt-5" aria-labelledby={`enunciado-${pregunta.id}`}>
          <div className="flex flex-col gap-2.5">
            {pregunta.opciones.map((texto, i) => (
              <Opcion
                key={`${pregunta.id}-${i}`}
                nombre={`p-${pregunta.id}`}
                indice={i}
                texto={texto}
                estado={estadoOpcion(i)}
                marcada={elegida === i}
                bloqueada={comprobada || enviando}
                onElegir={elegir}
              />
            ))}
          </div>
        </fieldset>

        {modo === "examen" && elegida !== undefined && elegida !== null && (
          <button
            type="button"
            onClick={borrar}
            className="mt-3 inline-flex min-h-11 items-center px-1 text-[0.95rem] text-pizarra underline underline-offset-4 hover:text-tinta"
          >
            Dejar en blanco
          </button>
        )}

        <div aria-live="polite">
          {modo === "estudio" && comprobada && (
            <div className="mt-6">
              <Explicacion pregunta={pregunta} respuesta={elegida} />
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-md border border-teja bg-teja-suave p-3">
            {error}
          </p>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-filete bg-papel pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-lectura gap-2 px-4 py-3">
          {modo === "examen" && indice > 0 && (
            <Boton variante="secundario" onClick={() => setIndice((i) => i - 1)} aria-label="Pregunta anterior">
              ←
            </Boton>
          )}
          <Boton ancho onClick={accionPrincipal} disabled={principalDesactivado}>
            <span>{enviando ? "Corrigiendo…" : textoPrincipal}</span>
            <span aria-hidden="true">→</span>
          </Boton>
        </div>
      </footer>

      <dialog
        ref={dialogoSalir}
        className="m-auto w-[min(92vw,26rem)] rounded-md border border-filete bg-papel p-5 text-tinta backdrop:bg-tinta/40"
      >
        <h2 className="font-serif text-xl font-semibold">¿Salir del test?</h2>
        <p className="mt-2">Las respuestas de este test no se guardarán.</p>
        <div className="mt-5 flex flex-col gap-2">
          <Boton variante="principal" onClick={() => dialogoSalir.current?.close()} autoFocus>
            Seguir con el test
          </Boton>
          <Boton variante="secundario" onClick={() => router.push(salirA)}>
            Salir
          </Boton>
        </div>
      </dialog>

      <dialog
        ref={dialogoTerminar}
        className="m-auto w-[min(92vw,26rem)] rounded-md border border-filete bg-papel p-5 text-tinta backdrop:bg-tinta/40"
      >
        <h2 className="font-serif text-xl font-semibold">¿Terminar el examen?</h2>
        <p className="mt-2">
          {enBlanco === 0
            ? "Has respondido todas las preguntas."
            : enBlanco === 1
              ? "Te queda 1 pregunta en blanco."
              : `Te quedan ${enBlanco} preguntas en blanco.`}{" "}
          Las preguntas en blanco no restan.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Boton onClick={terminar} autoFocus>
            Terminar y ver corrección
          </Boton>
          <Boton variante="secundario" onClick={() => dialogoTerminar.current?.close()}>
            Revisar respuestas
          </Boton>
        </div>
      </dialog>
    </div>
  );
}

function Cronometro({
  minutos,
  inicio,
  alAcabar,
}: {
  minutos: number;
  inicio?: string;
  alAcabar: () => void;
}) {
  const [fin] = useState(() => (inicio ? Date.parse(inicio) : Date.now()) + minutos * 60_000);
  const [ahora, setAhora] = useState(() => Date.now());
  const acabado = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const restante = Math.max(0, fin - ahora);
  useEffect(() => {
    if (restante === 0 && !acabado.current) {
      acabado.current = true;
      alAcabar();
    }
  }, [restante, alAcabar]);

  const min = Math.floor(restante / 60_000);
  const seg = Math.floor((restante % 60_000) / 1000);
  const poco = restante < 5 * 60_000;
  return (
    <span
      className={`text-[0.95rem] font-semibold tabular-nums ${poco ? "text-teja" : "text-pizarra"}`}
      aria-label={`Quedan ${min} minutos`}
      role="timer"
    >
      {min}:{String(seg).padStart(2, "0")}
    </span>
  );
}

