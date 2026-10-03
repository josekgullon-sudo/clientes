"use client";

import { useState } from "react";
import { EnlaceBoton, Boton } from "@/components/boton";
import { calcularResultado, temasAMejorar, type PreguntaTest } from "@/lib/test/tipos";
import { ListaCorreccion } from "./lista-correccion";
import { Resumen } from "./resumen";
import { SesionTest } from "./sesion-test";

/** Test gratuito sin registro (demo y páginas por ley). La corrección se hace en el navegador. */
export function TestPublico({
  preguntas,
  salirA,
}: {
  preguntas: PreguntaTest[];
  salirA: string;
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
        alTerminarLocal={(r) => {
          setRespuestas(r);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  const resultado = calcularResultado(preguntas, respuestas, 0);
  const estados = preguntas.map((p) => {
    const r = respuestas.get(p.id) ?? null;
    return r === null ? ("pendiente" as const) : r === p.correcta ? ("acierto" as const) : ("fallo" as const);
  });

  return (
    <main className="flex-1">
      <Resumen
        resultado={resultado}
        penalizacion={0}
        estados={estados}
        temas={temasAMejorar(preguntas, respuestas)}
        acciones={
          <>
            <div className="mb-4 border-l-[3px] border-subrayador pl-4">
              <p className="font-serif text-[1.125rem] font-semibold">Sigue donde lo has dejado</p>
              <p className="mt-1">
                Crea tu cuenta para hacer test de todo el temario, repasar tus fallos y ver tu progreso por tema.
              </p>
            </div>
            <EnlaceBoton href="/entrar?registro=1" ancho>
              Crear mi cuenta
            </EnlaceBoton>
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
