import { Flame } from "lucide-react";

/**
 * Contador de aciertos seguidos. La llama crece con cada acierto y, a partir de 3, se enciende:
 * se rellena, brilla y se mueve más. Al encenderse da un estallido (la `key` lo reinicia).
 */
export function LlamaRacha({ combo }: { combo: number }) {
  const encendida = combo >= 3;
  const tamano = Math.min(18 + combo * 3, 36);
  return (
    <p
      className={`cifras flex min-w-12 items-center justify-end gap-0.5 font-display font-black ${encendida ? "text-naranja-texto" : "text-naranja"}`}
      aria-label={`${combo} ${combo === 1 ? "acierto seguido" : "aciertos seguidos"}`}
    >
      <span key={encendida ? "encendida" : "apagada"} className={encendida ? "llama-encender" : "rebote"} aria-hidden="true">
        <Flame
          size={tamano}
          strokeWidth={encendida ? 2 : 2.4}
          className={`transition-[width,height] duration-300 ${encendida ? "llama-viva fill-[#facc15] text-[#f97316]" : "llama"}`}
        />
      </span>
      <span key={combo} className="rebote text-lg leading-none">
        {combo}
      </span>
    </p>
  );
}
