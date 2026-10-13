"use client";

import { useState } from "react";
import { EnlaceBoton, Boton } from "@/components/boton";
import { ClaraDice } from "@/components/mascota/bocadillo";
import { sonidos } from "@/lib/ui/sonido";
import { evento } from "@/components/evento";
import { CLAVE_DEMO, type DemoGuardada } from "@/lib/test/demo-local";
import { calcularResultado, temasAMejorar, type PreguntaTest } from "@/lib/test/tipos";
import { ListaCorreccion } from "./lista-correccion";
import { Resumen } from "./resumen";
import { SesionTest } from "./sesion-test";

const PENALIZACION = 1 / 3;

/** Test gratuito sin registro. La corrección se hace en el navegador y los fallos se guardan en el dispositivo. */
export function TestPublico({
  preguntas,
  salirA,
  origen = "demo",
  siguiente,
}: {
  preguntas: PreguntaTest[];
  salirA: string;
  origen?: string;
  siguiente?: { href: string; texto: string } | null;
}) {
  const [ronda, setRonda] = useState(0);
  const [respuestas, setRespuestas] = useState<Map<string, number | null> | null>(null);

  if (!respuestas) {
    return (
      <SesionTest
        key={ronda}
        preguntas={preguntas}
        modo="estudio"
        salirA={salirA}
        avisoEn={Math.min(5, preguntas.length)}
        aviso="Al acabar puedes guardar los fallos."
        alTerminarLocal={(r) => {
          const resultado = calcularResultado(preguntas, r, PENALIZACION);
          const guardado: DemoGuardada = {
            v: 1,
            origen,
            fallos: resultado.fallos,
            respuestas: preguntas.map((p) => ({ pregunta_id: p.id, respuesta: r.get(p.id) ?? null })),
          };
          try {
            localStorage.setItem(CLAVE_DEMO, JSON.stringify(guardado));
          } catch {
            /* sin almacenamiento: el resultado se ve igual */
          }
          evento("demo_end", { fallos: resultado.fallos, aciertos: resultado.aciertos });
          sonidos.fin();
          setRespuestas(r);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  const resultado = calcularResultado(preguntas, respuestas, PENALIZACION);
  const nFallos = resultado.fallos;
  const textoFallos =
    nFallos === 0 ? "Guarda tu resultado" : nFallos === 1 ? "Guarda tu fallo para repasarlo" : `Guarda tus ${nFallos} fallos para repasarlos`;

  return (
    <main className="flex-1 bg-papel">
      <Resumen
        resultado={resultado}
        penalizacion={PENALIZACION}
        temas={temasAMejorar(preguntas, respuestas)}
        acciones={
          <>
            <div className="tarjeta p-5">
              <ClaraDice pose="senala" tamano="size-20">
                {textoFallos}: crea tu cuenta y te los guardo para mañana.
              </ClaraDice>
              <ul className="mt-1 grid grid-cols-3 gap-2 text-center text-xs font-bold text-pizarra">
                <li className="rounded-xl bg-naranja-suave px-2 py-2 text-naranja-texto">🔥 Tu racha diaria</li>
                <li className="rounded-xl bg-cielo-suave px-2 py-2 text-cielo-texto">🔁 Repaso de fallos</li>
                <li className="rounded-xl bg-pino-suave px-2 py-2 text-pino">🎁 Gratis, sin tarjeta</li>
              </ul>
              <EnlaceBoton href={`/entrar?registro=1&siguiente=${encodeURIComponent("/app")}`} ancho className="mt-4">
                Crear cuenta gratis
              </EnlaceBoton>
            </div>
            {siguiente && (
              <EnlaceBoton href={siguiente.href} variante="secundario" ancho>
                Otro test · {siguiente.texto}
              </EnlaceBoton>
            )}
            <Boton
              variante="texto"
              ancho
              onClick={() => {
                setRespuestas(null);
                setRonda((n) => n + 1);
              }}
            >
              Repetir este test
            </Boton>
          </>
        }
      />
      <ListaCorreccion preguntas={preguntas} respuestas={Object.fromEntries(respuestas)} />
    </main>
  );
}
