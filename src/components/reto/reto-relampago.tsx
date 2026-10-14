"use client";

import { Check, Timer, Trophy, X, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Boton, EnlaceBoton } from "@/components/boton";
import { ClaraDice } from "@/components/mascota/bocadillo";
import { Clara, type PoseClara } from "@/components/mascota/clara";
import { BotonCompartir } from "@/components/ui/boton-compartir";
import { LETRAS, type PreguntaTest } from "@/lib/test/tipos";
import { sonidoActivo, sonidos } from "@/lib/ui/sonido";

const DURACION = 60_000;
const CLAVE = "reto-relampago";

type Records = { mejor: number; dia: string; mejorDia: number };

function leerRecords(dia: string): Records {
  try {
    const r = JSON.parse(localStorage.getItem(CLAVE) ?? "null") as Records | null;
    if (r) return { mejor: r.mejor ?? 0, dia, mejorDia: r.dia === dia ? (r.mejorDia ?? 0) : 0 };
  } catch {
    /* sin almacenamiento */
  }
  return { mejor: 0, dia, mejorDia: 0 };
}

function guardarRecords(r: Records) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(r));
  } catch {
    /* sin almacenamiento */
  }
}

type Respuesta = { pregunta: PreguntaTest; elegida: number };

function Fallo({ p }: { p: PreguntaTest }) {
  return (
    <li className="tarjeta p-4">
      <p className="leading-snug font-bold">{p.enunciado}</p>
      <p className="mt-2 flex items-start gap-2 rounded-xl bg-pino-suave px-3 py-2 font-semibold text-pino">
        <Check aria-hidden size={18} className="mt-0.5 shrink-0" strokeWidth={3} />
        {p.opciones[p.correcta]}
      </p>
      <p className="mt-2 text-sm text-pizarra">{[p.ley, p.articulo].filter(Boolean).join(" · ")}</p>
    </li>
  );
}

/**
 * Reto relámpago: 60 segundos para acertar todas las que puedas. Fallar no resta.
 * Las preguntas son las mismas para todo el mundo ese día, así los récords se pueden comparar.
 */
export function RetoRelampago({
  preguntas,
  dia,
  conSesion,
}: {
  preguntas: PreguntaTest[];
  dia: string;
  conSesion: boolean;
}) {
  const [fase, setFase] = useState<"intro" | "cuenta" | "juego" | "fin">("intro");
  const [cuenta, setCuenta] = useState(3);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [marcada, setMarcada] = useState<number | null>(null);
  const [restante, setRestante] = useState(DURACION);
  const [records, setRecords] = useState<Records>({ mejor: 0, dia, mejorDia: 0 });
  const [nuevoRecord, setNuevoRecord] = useState(false);
  const fin = useRef(0);
  const ultimoTic = useRef(99);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- los récords viven en el dispositivo
    setRecords(leerRecords(dia));
  }, [dia]);

  const aciertos = respuestas.filter((r) => r.elegida === r.pregunta.correcta).length;
  const pregunta = preguntas[indice];

  const terminar = useCallback(
    (lista: Respuesta[]) => {
      const n = lista.filter((r) => r.elegida === r.pregunta.correcta).length;
      setFase("fin");
      sonidos.fin();
      setRecords((prev) => {
        const nuevo = { mejor: Math.max(prev.mejor, n), dia, mejorDia: Math.max(prev.mejorDia, n) };
        setNuevoRecord(n > 0 && n > prev.mejor);
        guardarRecords(nuevo);
        return nuevo;
      });
      window.scrollTo({ top: 0 });
    },
    [dia],
  );

  // Cuenta atrás 3, 2, 1.
  useEffect(() => {
    if (fase !== "cuenta") return;
    sonidos.tic();
    const t = setTimeout(() => {
      if (cuenta > 1) {
        setCuenta((c) => c - 1);
        return;
      }
      fin.current = Date.now() + DURACION;
      ultimoTic.current = 99;
      setFase("juego");
      sonidos.salida();
    }, 650);
    return () => clearTimeout(t);
  }, [fase, cuenta]);

  // Reloj del juego.
  useEffect(() => {
    if (fase !== "juego") return;
    const id = setInterval(() => {
      const r = Math.max(0, fin.current - Date.now());
      setRestante(r);
      const s = Math.ceil(r / 1000);
      if (s <= 5 && s > 0 && s < ultimoTic.current) {
        ultimoTic.current = s;
        sonidos.tic();
      }
    }, 100);
    return () => clearInterval(id);
  }, [fase]);

  useEffect(() => {
    if (fase === "juego" && restante === 0 && marcada === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se acaba el tiempo
      terminar(respuestas);
    }
  }, [fase, restante, marcada, respuestas, terminar]);

  const responder = useCallback(
    (i: number) => {
      if (fase !== "juego" || marcada !== null || !pregunta) return;
      setMarcada(i);
      const lista = [...respuestas, { pregunta, elegida: i }];
      setRespuestas(lista);
      if (i === pregunta.correcta) {
        // Aciertos seguidos al final de la lista, este incluido: el tono sube con la racha.
        let seguidas = 0;
        for (let k = lista.length - 1; k >= 0 && lista[k].elegida === lista[k].pregunta.correcta; k--) seguidas++;
        sonidos.acierto(seguidas);
      }
      else {
        sonidos.fallo();
        if (sonidoActivo()) navigator.vibrate?.(60);
      }
      setTimeout(
        () => {
          setMarcada(null);
          if (indice + 1 >= preguntas.length || Date.now() >= fin.current) terminar(lista);
          else setIndice((n) => n + 1);
        },
        i === pregunta.correcta ? 380 : 900,
      );
    },
    [fase, marcada, pregunta, respuestas, indice, preguntas.length, terminar],
  );

  // Teclado: 1-4 o A-D.
  useEffect(() => {
    if (fase !== "juego") return;
    function tecla(e: KeyboardEvent) {
      const t = e.key.toLowerCase();
      const i = ["1", "2", "3", "4"].indexOf(t) > -1 ? Number(t) - 1 : ["a", "b", "c", "d"].indexOf(t);
      if (i > -1 && pregunta && i < pregunta.opciones.length) responder(i);
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [fase, pregunta, responder]);

  function empezar() {
    setRespuestas([]);
    setIndice(0);
    setMarcada(null);
    setRestante(DURACION);
    setNuevoRecord(false);
    setCuenta(3);
    setFase("cuenta");
  }

  const salir = conSesion ? "/app" : "/";

  if (fase === "intro") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lectura flex-col gap-6 px-4 pt-4 pb-10">
        <Link href={salir} aria-label="Salir" className="inline-flex size-11 items-center justify-center self-start rounded-xl text-pizarra hover:bg-papel-hundido">
          <X aria-hidden size={24} strokeWidth={2.4} />
        </Link>
        <section className="flex flex-col items-center text-center" aria-labelledby="titulo-reto">
          <div className="relative">
            <span className="rayo-fondo" aria-hidden="true" />
            <Clara pose="hola" saludoInfinito className="relative size-36" />
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-oro-suave px-3 py-1 text-sm font-black text-oro-texto">
            <Zap aria-hidden size={16} className="fill-subrayador text-subrayador" /> Reto del día
          </p>
          <h1 id="titulo-reto" className="mt-2 font-display text-[2.25rem] leading-tight font-black">
            Reto relámpago
          </h1>
          <p className="mt-2 max-w-sm text-lg font-semibold text-pizarra">
            Tienes 60 segundos. Acierta todas las que puedas. Fallar no resta: ¡sigue!
          </p>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <div className="tarjeta flex flex-col items-center p-4 text-center">
            <Timer aria-hidden size={24} className="text-cielo-texto" />
            <p className="cifras mt-1 font-display text-2xl font-black">{records.mejorDia}</p>
            <p className="text-sm font-bold text-pizarra">Tu récord de hoy</p>
          </div>
          <div className="tarjeta flex flex-col items-center p-4 text-center">
            <Trophy aria-hidden size={24} className="text-oro-texto" />
            <p className="cifras mt-1 font-display text-2xl font-black">{records.mejor}</p>
            <p className="text-sm font-bold text-pizarra">Tu mejor marca</p>
          </div>
        </div>
        <Boton ancho onClick={empezar} className="mt-auto">
          ¡Empezar!
        </Boton>
      </main>
    );
  }

  if (fase === "cuenta") {
    return (
      <main className="grid min-h-dvh place-items-center" aria-live="assertive">
        <p key={cuenta} className="rebote font-display text-[8rem] leading-none font-black text-pino">
          {cuenta}
        </p>
      </main>
    );
  }

  if (fase === "juego" && pregunta) {
    const ratio = restante / DURACION;
    const segundos = Math.ceil(restante / 1000);
    const apurado = segundos <= 10;
    return (
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-10 bg-papel/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-lectura items-center gap-3 px-4">
            <span className={`cifras flex min-w-14 items-center gap-1 font-display text-xl font-black ${apurado ? "latido text-teja" : "text-cielo-texto"}`} aria-label={`Quedan ${segundos} segundos`}>
              <Timer aria-hidden size={20} /> {segundos}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-papel-hundido" aria-hidden="true">
              <div
                className={`h-full rounded-full ${apurado ? "bg-teja-vivo" : "bg-cielo-vivo"}`}
                style={{ width: `${ratio * 100}%`, transition: "width 100ms linear" }}
              />
            </div>
            <span className="cifras flex min-w-14 items-center justify-end gap-1 font-display text-xl font-black text-oro-texto" aria-label={`${aciertos} aciertos`}>
              <Zap aria-hidden size={20} className="fill-subrayador text-subrayador" />
              <span key={aciertos} className="rebote">{aciertos}</span>
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-lectura flex-1 px-4 pt-4 pb-10">
          <p key={pregunta.id} className="aparecer font-display text-[1.375rem] leading-snug font-extrabold [text-wrap:pretty]">
            {pregunta.enunciado}
          </p>
          <div className="mt-5 grid gap-3" role="group" aria-label="Opciones">
            {pregunta.opciones.map((texto, i) => {
              const estado =
                marcada === null ? "libre" : i === pregunta.correcta ? "correcta" : i === marcada ? "fallada" : "neutra";
              return (
                <button
                  key={`${pregunta.id}-${i}`}
                  type="button"
                  onClick={() => responder(i)}
                  disabled={marcada !== null}
                  className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition duration-150 ${
                    estado === "libre"
                      ? "border-filete bg-superficie shadow-[0_3px_0_var(--filete)] active:translate-y-[2px] active:shadow-none"
                      : estado === "correcta"
                        ? "opcion-ok border-pino-vivo bg-pino-suave shadow-[0_3px_0_var(--pino-vivo)]"
                        : estado === "fallada"
                          ? "opcion-mal border-teja-vivo bg-teja-suave shadow-[0_3px_0_var(--teja-vivo)]"
                          : "border-filete bg-superficie opacity-50"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-8 shrink-0 place-items-center rounded-xl border-2 text-sm font-extrabold ${
                      estado === "correcta"
                        ? "border-pino-vivo bg-pino-boton text-sobre-pino"
                        : estado === "fallada"
                          ? "border-teja-vivo bg-[#dc2626] text-white"
                          : "border-filete bg-papel text-pizarra"
                    }`}
                  >
                    {estado === "correcta" ? <Check size={17} strokeWidth={3} /> : estado === "fallada" ? <X size={17} strokeWidth={3} /> : LETRAS[i]}
                  </span>
                  <span className="flex-1 leading-snug">{texto}</span>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // Fin
  const respondidas = respuestas.length;
  const fallos = respuestas.filter((r) => r.elegida !== r.pregunta.correcta);
  const pose: PoseClara = aciertos >= 10 ? "celebra" : aciertos >= 5 ? "feliz" : "animo";
  const titulo = nuevoRecord ? "¡Nuevo récord!" : aciertos >= 10 ? "¡Rapidísimo!" : aciertos >= 5 ? "¡Muy bien!" : "¡Buen calentamiento!";

  return (
    <main className="mx-auto flex w-full max-w-lectura flex-col gap-6 px-4 pt-8 pb-12">
      <section className="relative flex flex-col items-center text-center" aria-labelledby="titulo-fin">
        {(nuevoRecord || aciertos >= 5) && (
          <div className="confeti" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => (
              <span key={i} style={{ left: `${3 + i * 6}%`, animationDelay: `${i * 0.06}s` }} />
            ))}
          </div>
        )}
        <Clara pose={pose} className="size-32" />
        <h1 id="titulo-fin" className="mt-3 font-display text-[2rem] leading-tight font-black text-pino">
          {titulo}
        </h1>
        <p className="mt-3 flex items-baseline gap-2 font-display font-black">
          <span className="cifras text-6xl text-oro-texto">{aciertos}</span>
          <span className="text-xl">{aciertos === 1 ? "acierto" : "aciertos"}</span>
        </p>
        <p className="cifras mt-1 font-semibold text-pizarra">
          de {respondidas} {respondidas === 1 ? "respondida" : "respondidas"} en 60 segundos · récord {records.mejor}
        </p>
      </section>

      <div className="flex flex-col gap-3">
        <BotonCompartir
          tipo="reto"
          n={aciertos}
          ruta="/reto"
          etiqueta="Retar a alguien"
          texto={`He acertado ${aciertos} preguntas en 60 segundos en el Reto relámpago de Oposiciones Claras. ¿Me superas?`}
        />
        <Boton ancho variante="secundario" onClick={empezar}>
          Jugar otra vez
        </Boton>
      </div>

      {conSesion ? (
        <EnlaceBoton href="/app" variante="texto" className="self-center">
          Volver a tu camino
        </EnlaceBoton>
      ) : (
        <ClaraDice pose="senala" tamano="size-20">
          <span className="block">Con tu cuenta gratis guardas tu racha y repasas tus fallos.</span>
          <span className="mt-3 block">
            <EnlaceBoton href="/entrar?registro=1" tamano="md">
              Crear cuenta gratis
            </EnlaceBoton>
          </span>
        </ClaraDice>
      )}

      {fallos.length > 0 && (
        <section aria-labelledby="repasa">
          <h2 id="repasa" className="mb-3 font-display text-xl font-black">
            Repasa las que se escaparon
          </h2>
          <ul className="flex flex-col gap-3">
            {fallos.slice(0, 5).map(({ pregunta: p }) => (
              <Fallo key={p.id} p={p} />
            ))}
          </ul>
          {fallos.length > 5 && (
            <details className="mt-3">
              <summary className="enlace inline-flex min-h-11 cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden">
                Ver las otras {fallos.length - 5}
              </summary>
              <ul className="mt-3 flex flex-col gap-3">
                {fallos.slice(5).map(({ pregunta: p }) => (
                  <Fallo key={p.id} p={p} />
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </main>
  );
}
