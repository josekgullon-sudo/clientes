"use client";

import { useState } from "react";
import { EnlaceBoton, Boton } from "@/components/boton";
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
          setRespuestas(r);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  const resultado = calcularResultado(preguntas, respuestas, PENALIZACION);
  const estados = preguntas.map((p) => {
    const r = respuestas.get(p.id) ?? null;
    return r === null ? ("pendiente" as const) : r === p.correcta ? ("acierto" as const) : ("fallo" as const);
  });
  const nFallos = resultado.fallos;
  const textoFallos =
    nFallos === 0 ? "Guarda este resultado" : nFallos === 1 ? "Guarda tu fallo" : `Guarda tus ${nFallos} fallos`;

  return (
    <main className="flex-1">
      <Resumen
        resultado={resultado}
        penalizacion={PENALIZACION}
        estados={estados}
        temas={temasAMejorar(preguntas, respuestas)}
        acciones={
          <>
            <div className="tarjeta mb-4 p-4">
              <p className="font-semibold">{textoFallos}</p>
              <p className="mt-1 text-sm text-pizarra">
                Nota {resultado.nota.toLocaleString("es-ES", { maximumFractionDigits: 2 })}/10. Se importan al crear la cuenta.
              </p>
            </div>
            <EnlaceBoton href={`/entrar?registro=1&siguiente=${encodeURIComponent("/app")}`} ancho>
              {textoFallos}
            </EnlaceBoton>
            {siguiente && (
              <EnlaceBoton href={siguiente.href} variante="secundario" ancho>
                Otro test de 10 · {siguiente.texto}
              </EnlaceBoton>
            )}
            <Boton
              variante="secundario"
              ancho
              onClick={() => {
                setRespuestas(null);
                setRonda((n) => n + 1);
              }}
            >
              Repetir el test
            </Boton>
          </>
        }
      />
      <ListaCorreccion preguntas={preguntas} respuestas={Object.fromEntries(respuestas)} />
    </main>
  );
}
