import Link from "next/link";
import type { ReactNode } from "react";
import { AccesoPublico } from "./acceso-publico";
import { InterruptorTema } from "./interruptor-tema";
import { Logo } from "./logo";

/**
 * Cabecera fija. Sin `derecha`, muestra el acceso de la web pública.
 * Con `derecha={null}` no muestra nada (onboarding, pantallas de un solo paso).
 */
export function Cabecera({ derecha, inicio = "/" }: { derecha?: ReactNode | null; inicio?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-filete/70 bg-papel/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href={inicio} className="rounded-xl">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <InterruptorTema />
          {derecha === undefined ? <AccesoPublico /> : derecha}
        </div>
      </div>
    </header>
  );
}
