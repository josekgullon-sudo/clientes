import { LETRAS } from "@/lib/test/tipos";

export type EstadoOpcion = "libre" | "elegida" | "correcta" | "fallada" | "neutra";

const estilos: Record<EstadoOpcion, { caja: string; letra: string }> = {
  libre: {
    caja: "border-filete bg-papel hover:bg-papel-hundido",
    letra: "border-pizarra/60 text-pizarra",
  },
  elegida: {
    caja: "border-tinta bg-papel-hundido ring-1 ring-tinta",
    letra: "border-tinta bg-tinta text-papel",
  },
  correcta: {
    caja: "border-pino bg-pino-suave ring-1 ring-pino",
    letra: "border-pino bg-pino text-papel",
  },
  fallada: {
    caja: "border-teja bg-teja-suave",
    letra: "border-teja bg-teja text-papel",
  },
  neutra: {
    caja: "border-filete bg-papel",
    letra: "border-filete text-pizarra",
  },
};

const marcas: Partial<Record<EstadoOpcion, { icono: string; texto: string }>> = {
  correcta: { icono: "✓", texto: "Respuesta correcta" },
  fallada: { icono: "✕", texto: "Tu respuesta" },
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
      className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta ${e.caja} ${bloqueada ? "cursor-default" : ""}`}
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
        className={`mt-px flex size-7 shrink-0 items-center justify-center rounded-full border text-[0.9rem] font-bold ${e.letra}`}
      >
        {LETRAS[indice]}
      </span>
      <span className="flex-1 pt-0.5 text-[1.0625rem] leading-snug">{texto}</span>
      {marca && (
        <span className="pt-0.5 text-lg font-bold" aria-hidden="true">
          {marca.icono}
        </span>
      )}
      {marca && <span className="sr-only">. {marca.texto}</span>}
    </label>
  );
}
