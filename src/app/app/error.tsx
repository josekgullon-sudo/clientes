"use client";

import { Boton } from "@/components/boton";

export default function ErrorApp({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-black">Algo no ha cargado</h1>
      <p className="font-semibold text-pizarra">No pasa nada, tu progreso está guardado.</p>
      <Boton type="button" onClick={reset}>Reintentar</Boton>
    </main>
  );
}
