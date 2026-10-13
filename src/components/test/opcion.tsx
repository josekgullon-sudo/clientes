import { Check, X } from "lucide-react";
import { LETRAS } from "@/lib/test/tipos";

export type EstadoOpcion = "libre" | "elegida" | "correcta" | "fallada" | "neutra";

const estilos: Record<EstadoOpcion, { caja: string; letra: string }> = {
  libre: {
    caja: "border-filete bg-superficie shadow-[0_3px_0_var(--filete)] hover:bg-papel-hundido active:translate-y-[2px] active:shadow-none",
    letra: "border-filete bg-papel text-pizarra",
  },
  elegida: {
    caja: "border-cielo bg-cielo-suave shadow-[0_3px_0_var(--cielo)]",
    letra: "border-cielo-texto bg-cielo-texto text-superficie",
  },
  correcta: {
    caja: "border-pino-vivo bg-pino-suave shadow-[0_3px_0_var(--pino-vivo)]",
    letra: "border-pino-vivo bg-pino-boton text-sobre-pino",
  },
  fallada: {
    caja: "border-teja-vivo bg-teja-suave shadow-[0_3px_0_var(--teja-vivo)]",
    letra: "border-teja-vivo bg-[#dc2626] text-white",
  },
  neutra: {
    caja: "border-filete bg-superficie opacity-60",
    letra: "border-filete bg-papel text-pizarra",
  },
};

const marcas: Partial<Record<EstadoOpcion, string>> = {
  correcta: "Respuesta correcta",
  fallada: "Tu respuesta",
};

/** Opción de respuesta como bloque grande. Es un radio real para que funcione con teclado y lector. */
export function Opcion({
  nombre,
  indice,
  texto,
  estado,
  marcada,
  bloqueada,
  onElegir,
}: {
  nombre: string;
  indice: number;
  texto: string;
  estado: EstadoOpcion;
  /** Es la respuesta que ha elegido el usuario. */
  marcada: boolean;
  bloqueada: boolean;
  onElegir: (i: number) => void;
}) {
  const e = estilos[estado];
  const marca = marcas[estado];
  return (
    <label
      className={`flex min-h-16 cursor-pointer items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 transition duration-150 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta ${e.caja} ${bloqueada ? "cursor-default" : ""} ${estado === "correcta" ? "opcion-ok" : ""} ${estado === "fallada" ? "opcion-mal" : ""}`}
    >
      <input
        type="radio"
        name={nombre}
        value={indice}
        checked={marcada}
        onChange={() => onElegir(indice)}
        disabled={bloqueada}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex size-8 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-extrabold transition ${e.letra}`}
      >
        {estado === "correcta" ? (
          <Check size={17} strokeWidth={3} />
        ) : estado === "fallada" ? (
          <X size={17} strokeWidth={3} />
        ) : (
          LETRAS[indice]
        )}
      </span>
      <span className="flex-1 text-[1.0625rem] leading-snug font-semibold">{texto}</span>
      {marca && <span className="sr-only">. {marca}</span>}
    </label>
  );
}
