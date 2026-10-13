"use client";

import { BookOpen, Crown, Lock, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EnlaceBoton } from "@/components/boton";
import { Clara } from "@/components/mascota/clara";
import { nivelVisible, siguienteLeccion, type NodoCamino } from "@/lib/estudio/camino";
import { AccionesLeccion, Niveles } from "./camino";

type Estado = "actual" | "empezado" | "corona" | "cerrado" | "vacio" | "pendiente";

const NOMBRES_BLOQUE: Record<string, string> = {
  I: "Organización pública",
  II: "Actividad administrativa y ofimática",
};

const COLORES_BLOQUE: Record<string, { fondo: string; sombra: string }> = {
  I: { fondo: "#15803d", sombra: "#0f5f2d" },
  II: { fondo: "#0369a1", sombra: "#075985" },
};

// Desplazamiento horizontal de cada nodo: un zigzag suave como el de las apps de idiomas.
const ZIGZAG = [0, 44, 70, 44, 0, -44, -70, -44];

function estadoDe(t: NodoCamino, actualId: string | undefined, premium: boolean): Estado {
  if (t.total === 0) return "vacio";
  if (t.corona) return "corona";
  if (t.tema_id === actualId) return "actual";
  if (!premium && nivelVisible(t) >= 3) return "cerrado";
  if (t.lecciones > 0) return "empezado";
  return "pendiente";
}

const estilosNodo: Record<Estado, { fondo: string; sombra: string; texto: string }> = {
  actual: { fondo: "#15803d", sombra: "#0f5f2d", texto: "#ffffff" },
  empezado: { fondo: "#22c55e", sombra: "#15803d", texto: "#ffffff" },
  corona: { fondo: "#facc15", sombra: "#ca8a04", texto: "#713f12" },
  cerrado: { fondo: "var(--papel-hundido)", sombra: "var(--filete)", texto: "var(--pizarra)" },
  pendiente: { fondo: "var(--papel-hundido)", sombra: "var(--filete)", texto: "var(--pizarra)" },
  vacio: { fondo: "var(--papel)", sombra: "transparent", texto: "var(--pizarra)" },
};

function Nodo({
  tema,
  estado,
  abierto,
  onPulsar,
}: {
  tema: NodoCamino;
  estado: Estado;
  abierto: boolean;
  onPulsar: () => void;
}) {
  const e = estilosNodo[estado];
  const nivel = nivelVisible(tema);
  const tam = estado === "actual" ? 80 : 68;
  return (
    <button
      type="button"
      onClick={onPulsar}
      aria-expanded={abierto}
      aria-label={`Tema ${tema.numero}: ${tema.titulo}`}
      className={`relative grid place-items-center rounded-full transition active:translate-y-[4px] ${estado === "actual" ? "nodo-pulso" : ""}`}
      style={{
        width: tam,
        height: tam,
        background: e.fondo,
        color: e.texto,
        boxShadow: estado === "vacio" ? "none" : `0 6px 0 ${e.sombra}`,
        border: estado === "vacio" ? "3px dashed var(--filete)" : undefined,
      }}
    >
      {estado === "actual" && (
        <svg className="pointer-events-none absolute -inset-[9px]" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--papel-hundido)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#22c55e"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(2 * Math.PI * 46 * (nivel - 1)) / 5} 999`}
            transform="rotate(-90 50 50)"
          />
        </svg>
      )}
      {estado === "corona" ? (
        <Crown aria-hidden size={30} strokeWidth={2.5} />
      ) : estado === "cerrado" ? (
        <Lock aria-hidden size={26} strokeWidth={2.5} />
      ) : estado === "vacio" ? (
        <BookOpen aria-hidden size={24} strokeWidth={2.2} />
      ) : (
        <Star aria-hidden size={estado === "actual" ? 34 : 28} strokeWidth={2.5} fill="currentColor" />
      )}
    </button>
  );
}

/** Camino de temas en zigzag: un nodo por tema y una ficha al pulsar con lo que puedes hacer. */
export function CaminoJuego({
  temas,
  premium,
  puedeLeccion,
  soloAlrededor = false,
}: {
  temas: NodoCamino[];
  premium: boolean;
  puedeLeccion: boolean;
  /** En el panel solo se muestran los temas cercanos a la lección actual. */
  soloAlrededor?: boolean;
}) {
  const actual = siguienteLeccion(temas, premium);
  const [abierto, setAbierto] = useState<string | null>(actual?.tema_id ?? null);
  const raiz = useRef<HTMLDivElement>(null);

  // Cierra la ficha al pulsar fuera.
  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(null);
    }
    document.addEventListener("click", fuera);
    return () => document.removeEventListener("click", fuera);
  }, []);

  const orden = [...temas].sort((a, b) => a.numero - b.numero);
  let visibles = orden;
  if (soloAlrededor && actual) {
    const i = orden.findIndex((t) => t.tema_id === actual.tema_id);
    const bloque = actual.bloque;
    visibles = orden.filter((t, k) => t.bloque === bloque && k >= i - 2 && k <= i + 4);
  } else if (soloAlrededor) {
    visibles = orden.slice(0, 6);
  }
  const bloques = [...new Set(visibles.map((t) => t.bloque))];

  return (
    <div ref={raiz} className="flex flex-col gap-10 overflow-x-clip">
      {bloques.map((bloque) => {
        const delBloque = visibles.filter((t) => t.bloque === bloque);
        const todos = temas.filter((t) => t.bloque === bloque && t.total > 0);
        const coronas = todos.filter((t) => t.corona).length;
        const color = COLORES_BLOQUE[bloque] ?? COLORES_BLOQUE.I;
        return (
          <section key={bloque} aria-labelledby={`bloque-${bloque}`}>
            <div
              className="flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-white"
              style={{ background: color.fondo, boxShadow: `0 4px 0 ${color.sombra}` }}
            >
              <div>
                <h2 id={`bloque-${bloque}`} className="font-display text-xl font-black">
                  Bloque {bloque}
                </h2>
                <p className="text-sm font-bold opacity-90">{NOMBRES_BLOQUE[bloque] ?? ""}</p>
              </div>
              <p className="cifras shrink-0 rounded-xl bg-white/20 px-3 py-1.5 text-sm font-black">
                {todos.length ? `${coronas}/${todos.length}` : "Pronto"}
              </p>
            </div>

            <ol className="mt-8 flex flex-col items-center gap-7">
              {delBloque.map((t) => {
                const estado = estadoDe(t, actual?.tema_id, premium);
                const desplazamiento = ZIGZAG[orden.indexOf(t) % ZIGZAG.length];
                const estaAbierto = abierto === t.tema_id;
                return (
                  <li
                    key={t.tema_id}
                    className="relative flex flex-col items-center"
                    style={{ transform: `translateX(${desplazamiento}px)` }}
                    aria-current={estado === "actual" ? "step" : undefined}
                  >
                    {estado === "actual" && !estaAbierto && (
                      <span className="flotar absolute -top-11 z-10 rounded-xl border-2 border-filete bg-superficie px-3 py-1.5 text-sm font-black whitespace-nowrap text-pino uppercase">
                        Empezar
                        <span className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-filete bg-superficie" />
                      </span>
                    )}
                    <div className="relative">
                      {estado === "actual" && (
                        <Clara
                          pose="senala"
                          animada={false}
                          className={`absolute top-1 size-16 ${desplazamiento > 0 ? "right-full mr-6" : "left-full ml-6 -scale-x-100"}`}
                        />
                      )}
                      <Nodo
                        tema={t}
                        estado={estado}
                        abierto={estaAbierto}
                        onPulsar={() => setAbierto(estaAbierto ? null : t.tema_id)}
                      />
                    </div>
                    <span className="mt-3 text-xs font-black text-pizarra">Tema {t.numero}</span>

                    {estaAbierto && (
                      <div
                        className="rebote relative z-20 mt-4 w-[min(20rem,86vw)] rounded-2xl p-4 text-left shadow-alta"
                        style={{
                          // La ficha se centra en la pantalla aunque el nodo esté desplazado.
                          transform: `translateX(${-desplazamiento}px)`,
                          background:
                            estado === "actual" || estado === "empezado"
                              ? "#15803d"
                              : estado === "corona"
                                ? "#facc15"
                                : "var(--superficie)",
                          color: estado === "actual" || estado === "empezado" ? "#fff" : estado === "corona" ? "#422006" : undefined,
                          border: estado === "actual" || estado === "empezado" || estado === "corona" ? undefined : "2px solid var(--filete)",
                        }}
                      >
                        <p className="text-xs font-black tracking-wider uppercase opacity-80">
                          Tema {t.numero}
                          {t.total > 0 && !t.corona ? ` · Nivel ${nivelVisible(t)} de 5` : ""}
                          {t.corona ? " · Completado" : ""}
                        </p>
                        <p className="mt-1 line-clamp-3 font-display text-lg leading-snug font-black">{t.titulo}</p>
                        {t.total > 0 && (
                          <div className="mt-2">
                            <Niveles nodo={t} claro={estado === "actual" || estado === "empezado"} />
                          </div>
                        )}
                        <div className="mt-4">
                          {estado === "vacio" ? (
                            <p className="text-sm font-semibold text-pizarra">Estamos preparando las preguntas de este tema.</p>
                          ) : estado === "cerrado" ? (
                            <EnlaceBoton href="/suscripcion?motivo=nivel" variante="premium" ancho tamano="md">
                              <Crown aria-hidden size={16} /> Desbloquear con Premium
                            </EnlaceBoton>
                          ) : !puedeLeccion ? (
                            <p className="text-sm font-bold">Has hecho tus preguntas gratis de hoy. ¡Mañana sigues!</p>
                          ) : (
                            <div className="[&_button]:w-full">
                              <AccionesLeccion nodo={t} premium={premium} claro={estado === "actual" || estado === "empezado"} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
