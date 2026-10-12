"use client";

import { ArrowRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Boton } from "@/components/boton";
import type { PreguntaTest } from "@/lib/test/tipos";
import { evento } from "@/components/evento";
import { TestPublico } from "./test-publico";

/** Muestra la presentación (renderizada en el servidor, indexable) hasta que se pulsa Empezar. */
export function TestConIntro({
  preguntas,
  salirA,
  origen,
  siguiente,
  children,
}: {
  preguntas: PreguntaTest[];
  salirA: string;
  origen?: string;
  siguiente?: { href: string; texto: string } | null;
  children: ReactNode;
}) {
  const [empezado, setEmpezado] = useState(false);
  if (empezado) return <TestPublico preguntas={preguntas} salirA={salirA} origen={origen} siguiente={siguiente} />;
  return (
    <>
      {children}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-filete bg-superficie/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto max-w-lectura px-4 py-3">
          <Boton
            ancho
            onClick={() => {
              evento("demo_start");
              setEmpezado(true);
              window.scrollTo({ top: 0 });
            }}
          >
            Empezar test de {preguntas.length} preguntas <ArrowRight aria-hidden size={20} />
          </Boton>
        </div>
      </div>
    </>
  );
}
