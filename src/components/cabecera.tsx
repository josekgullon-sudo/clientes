import Link from "next/link";
import { SITIO } from "@/lib/sitio";
import { InterruptorTema } from "./interruptor-tema";

export function Cabecera({ derecha }: { derecha?: React.ReactNode }) {
  return (
    <header className="border-b border-filete">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-serif text-[1.125rem] font-semibold tracking-tight whitespace-nowrap sm:text-xl" aria-label={SITIO.nombre}>
          Oposiciones <span className="subrayado">Claras</span>
        </Link>
        <div className="flex items-center">
          <InterruptorTema />
          {derecha ?? (
            <Link
              href="/entrar"
              className="inline-flex min-h-11 items-center px-2 font-semibold underline decoration-filete decoration-2 underline-offset-4 hover:decoration-tinta"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
