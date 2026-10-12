"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Timer, X } from "lucide-react";
import { Boton } from "@/components/boton";
import {
  LETRAS,
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
  /** Aviso no bloqueante al llegar a esa pregunta (1-based). */
  avisoEn?: number;
  aviso?: string;
};

export function SesionTest({
  preguntas,
  modo,
  minutos,
  inicio,
  salirA,
  alTerminar,
  alTerminarLocal,
  avisoEn,
  aviso,
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

  const explicacion = useRef<HTMLDivElement>(null);

  function accionPrincipal() {
    if (modo === "estudio" && !comprobada) {
      if (elegida === undefined || elegida === null) return;
      setComprobadas((s) => new Set(s).add(pregunta.id));
      // La explicación aparece bajo las opciones: la acercamos sin perder el enunciado de vista.
      const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() =>
        explicacion.current?.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "nearest" }),
      );
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

  const respondidas = preguntas.filter((p) =>
    modo === "estudio" ? comprobadas.has(p.id) : (elegidas.get(p.id) ?? null) !== null,
  ).length;
  const avance = Math.round(((modo === "estudio" ? respondidas : indice + (elegida != null ? 1 : 0)) / preguntas.length) * 100);
  const acierto = comprobada && elegida === pregunta.correcta;

  const textoPrincipal =
    modo === "estudio" && !comprobada
      ? "Comprobar"
      : esUltima
        ? modo === "examen"
          ? "Terminar"
          : "Ver resultado"
        : modo === "estudio"
          ? "Continuar"
          : "Siguiente";
  const principalDesactivado =
    enviando || (modo === "estudio" && !comprobada && (elegida === undefined || elegida === null));
  const tonoPie =
    modo === "estudio" && comprobada ? (acierto ? "bg-pino-suave border-pino/30" : "bg-teja-suave border-teja/30") : "bg-superficie border-filete";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 bg-papel/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-lectura items-center gap-3 px-3">
          <button
            type="button"
            onClick={() => dialogoSalir.current?.showModal()}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-pizarra transition hover:bg-papel-hundido hover:text-tinta"
            aria-label="Salir del test"
          >
            <X aria-hidden size={24} strokeWidth={2.4} />
          </button>
          <div
            className="h-3 flex-1 overflow-hidden rounded-full bg-papel-hundido"
            role="progressbar"
            aria-label={`Pregunta ${indice + 1} de ${preguntas.length}`}
            aria-valuemin={0}
            aria-valuemax={preguntas.length}
            aria-valuenow={indice + 1}
          >
            <div
              className="h-full rounded-full bg-pino transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(avance, 3)}%` }}
            />
          </div>
          {modo === "examen" && minutos ? (
            <Cronometro minutos={minutos} inicio={inicio} alAcabar={terminar} />
          ) : (
            <p className="cifras min-w-12 text-right text-sm font-bold text-pizarra" aria-hidden="true">
              {indice + 1}/{preguntas.length}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-lectura flex-1 px-4 pt-3 pb-44">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-pizarra">
          {modo === "examen" && <span className="cifras">Pregunta {indice + 1} de {preguntas.length}</span>}
          {pregunta.tema && (
            <span className="rounded-full bg-papel-hundido px-2.5 py-1">Tema {pregunta.tema.numero}</span>
          )}
          {pregunta.ley && <span className="rounded-full bg-papel-hundido px-2.5 py-1">{pregunta.ley}</span>}
        </p>
        <h1
          ref={titulo}
          tabIndex={-1}
          id={`enunciado-${pregunta.id}`}
          className="mt-4 font-serif text-[1.25rem] leading-[1.5] font-medium focus:outline-none focus-visible:shadow-none focus-visible:outline-none"
        >
          {pregunta.enunciado}
        </h1>

        {aviso && avisoEn === indice + 1 && !comprobada && (
          <p className="mt-4 rounded-xl bg-oro-suave px-3 py-2 text-[0.95rem] text-oro-texto" role="status">
            {aviso}
          </p>
        )}

        <fieldset className="mt-6" aria-labelledby={`enunciado-${pregunta.id}`}>
          <div className="flex flex-col gap-3">
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
            className="mt-3 inline-flex min-h-11 items-center px-1 text-[0.95rem] font-semibold text-pizarra underline underline-offset-4 hover:text-tinta"
          >
            Dejar en blanco
          </button>
        )}

        <div aria-live="polite" ref={explicacion} className="scroll-mb-48">
          {modo === "estudio" && comprobada && (
            <div className="aparecer mt-6">
              <Explicacion pregunta={pregunta} respuesta={elegida} titular={false} />
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-teja bg-teja-suave p-3">
            {error}
          </p>
        )}
      </main>

      <footer className={`fixed inset-x-0 bottom-0 z-10 border-t pb-[env(safe-area-inset-bottom)] transition-colors ${tonoPie}`}>
        <div className="mx-auto max-w-lectura px-4 pt-3 pb-4">
          {modo === "estudio" && comprobada && (
            <p className={`hoja mb-3 flex items-center gap-2.5 text-lg font-extrabold ${acierto ? "text-pino" : "text-teja"}`} role="status">
              <span
                className={`grid size-8 place-items-center rounded-full ${acierto ? "bg-pino text-superficie" : "bg-teja text-superficie"}`}
                aria-hidden="true"
              >
                {acierto ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
              </span>
              {acierto ? "¡Correcto!" : `La correcta es la ${LETRAS[pregunta.correcta]}`}
            </p>
          )}
          <div className="flex gap-2">
            {modo === "examen" && indice > 0 && (
              <Boton variante="secundario" onClick={() => setIndice((i) => i - 1)} aria-label="Pregunta anterior" className="px-4">
                <ArrowLeft aria-hidden size={20} />
              </Boton>
            )}
            <Boton ancho onClick={accionPrincipal} disabled={principalDesactivado}>
              {enviando ? "Corrigiendo…" : textoPrincipal}
              {!enviando && textoPrincipal !== "Comprobar" && <ArrowRight aria-hidden size={20} />}
            </Boton>
          </div>
        </div>
      </footer>

      <dialog
        ref={dialogoSalir}
        className="m-auto w-[min(92vw,26rem)] rounded-3xl border border-filete bg-superficie p-6 text-tinta shadow-alta backdrop:bg-tinta/50 backdrop:backdrop-blur-sm"
      >
        <h2 className="font-serif text-2xl font-semibold">¿Lo dejas por ahora?</h2>
        <p className="mt-2 text-pizarra">Si sales, las respuestas de este test no se guardan.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Boton variante="principal" onClick={() => dialogoSalir.current?.close()} autoFocus>
            Seguir con el test
          </Boton>
          <Boton variante="texto" onClick={() => router.push(salirA)} className="text-teja decoration-teja/35">
            Salir sin guardar
          </Boton>
        </div>
      </dialog>

      <dialog
        ref={dialogoTerminar}
        className="m-auto w-[min(92vw,26rem)] rounded-3xl border border-filete bg-superficie p-6 text-tinta shadow-alta backdrop:bg-tinta/50 backdrop:backdrop-blur-sm"
      >
        <h2 className="font-serif text-2xl font-semibold">¿Terminar el examen?</h2>
        <p className="mt-2 text-pizarra">
          {enBlanco === 0
            ? "Has respondido todas las preguntas."
            : enBlanco === 1
              ? "Te queda 1 pregunta en blanco."
              : `Te quedan ${enBlanco} preguntas en blanco.`}{" "}
          Las preguntas en blanco no restan.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Boton onClick={terminar} autoFocus>
            Terminar y ver la nota
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
      className={`cifras inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${poco ? "bg-teja-suave text-teja" : "bg-papel-hundido text-pizarra"}`}
      aria-label={`Quedan ${min} minutos`}
      role="timer"
    >
      <Timer aria-hidden size={14} />
      {min}:{String(seg).padStart(2, "0")}
    </span>
  );
}

