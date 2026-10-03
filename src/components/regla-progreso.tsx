type Estado = "acierto" | "fallo" | "respondida" | "pendiente";

/**
 * Barra de avance como regla graduada: una marca por pregunta.
 * Con muchas preguntas (simulacro) las marcas se agrupan en una barra continua.
 */
export function ReglaProgreso({
  total,
  actual,
  estados,
}: {
  total: number;
  actual: number; // índice 0-based de la pregunta en pantalla
  estados?: Estado[];
}) {
  const etiqueta = `Pregunta ${actual + 1} de ${total}`;
  if (total > 40) {
    const pct = Math.round(((actual + 1) / total) * 100);
    return (
      <div
        role="progressbar"
        aria-label={etiqueta}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={actual + 1}
        className="h-2 w-full bg-papel-hundido"
      >
        <div className="h-full bg-tinta" style={{ width: `${pct}%` }} />
      </div>
    );
  }
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={actual + 1}
      className="flex h-3 w-full items-end gap-[3px]"
    >
      {Array.from({ length: total }, (_, i) => {
        const estado = estados?.[i] ?? (i < actual ? "respondida" : "pendiente");
        const color =
          estado === "acierto"
            ? "bg-pino"
            : estado === "fallo"
              ? "bg-teja"
              : estado === "respondida"
                ? "bg-tinta"
                : "bg-filete";
        const alto = i === actual ? "h-3" : "h-2";
        return <span key={i} className={`${alto} flex-1 rounded-[1px] ${color}`} />;
      })}
    </div>
  );
}
