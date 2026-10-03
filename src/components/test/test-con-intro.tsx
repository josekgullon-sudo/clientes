"use client";

import { useState, type ReactNode } from "react";
import { Boton } from "@/components/boton";
import type { PreguntaTest } from "@/lib/test/tipos";
import { TestPublico } from "./test-publico";

/** Muestra la presentación (renderizada en el servidor, indexable) hasta que se pulsa Empezar. */
export function TestConIntro({
  preguntas,
  salirA,
  children,
}: {
  preguntas: PreguntaTest[];
  salirA: string;
  children: ReactNode;
}) {
  const [empezado, setEmpezado] = useState(false);
  if (empezado) return <TestPublico preguntas={preguntas} salirA={salirA} />;
  return (
    <>
      {children}
      <div className="fixed inset-x-0 bottom-0 border-t border-filete bg-papel pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-lectura px-4 py-3">
          <Boton
            ancho
            onClick={() => {
              setEmpezado(true);
              window.scrollTo({ top: 0 });
            }}
          >
            Empezar test de {preguntas.length} preguntas
          </Boton>
        </div>
      </div>
    </>
  );
}
