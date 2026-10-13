import { Crown, Flame, Zap } from "lucide-react";
import Link from "next/link";
import { InterruptorTema } from "@/components/interruptor-tema";
import { MarcaLogo } from "@/components/logo";
import { NavApp } from "./nav-app";

/** Cabecera del área privada: marca, racha, XP y plan siempre a la vista. */
export function BarraApp({ racha, xp, premium }: { racha: number; xp: number; premium: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-filete bg-papel/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/app" className="flex items-center gap-2 rounded-xl" aria-label="Inicio">
          <MarcaLogo className="size-9" />
        </Link>
        <NavApp lugar="cabecera" />
        <div className="flex items-center gap-1">
          <Link
            href="/app/estadisticas"
            className="cifras inline-flex min-h-11 items-center gap-1 rounded-xl px-2.5 font-display text-lg font-black text-naranja hover:bg-papel-hundido"
            aria-label={`Racha de ${racha} ${racha === 1 ? "día" : "días"}`}
          >
            <Flame aria-hidden size={22} className={racha > 0 ? "llama fill-naranja" : "text-filete"} strokeWidth={2.2} />
            <span className={racha > 0 ? "" : "text-pizarra"}>{racha}</span>
          </Link>
          <Link
            href="/app/cuenta"
            className="cifras inline-flex min-h-11 items-center gap-1 rounded-xl px-2.5 font-display text-lg font-black text-oro-texto hover:bg-papel-hundido"
            aria-label={`${xp} puntos de experiencia`}
          >
            <Zap aria-hidden size={21} className="fill-subrayador text-subrayador" />
            {xp}
          </Link>
          <Link
            href={premium ? "/app/cuenta" : "/suscripcion"}
            className="inline-flex min-h-11 items-center rounded-xl px-2.5 hover:bg-papel-hundido"
            aria-label={premium ? "Premium activo" : "Pasar a Premium"}
          >
            <Crown aria-hidden size={22} className={premium ? "fill-[#a78bfa] text-[#7c3aed]" : "text-pizarra"} strokeWidth={2.2} />
          </Link>
          <span className="hidden sm:block">
            <InterruptorTema />
          </span>
        </div>
      </div>
    </header>
  );
}
