/** Anillo de progreso del objetivo diario. */
export function Anillo({
  hecho,
  objetivo,
  tamano = 88,
  grosor = 9,
}: {
  hecho: number;
  objetivo: number;
  tamano?: number;
  grosor?: number;
}) {
  const radio = (tamano - grosor) / 2;
  const centro = tamano / 2;
  const circunferencia = 2 * Math.PI * radio;
  const ratio = objetivo > 0 ? Math.min(1, hecho / objetivo) : 0;
  const cumplido = hecho >= objetivo && objetivo > 0;
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${tamano} ${tamano}`}
      role="img"
      aria-label={`${hecho} de ${objetivo} preguntas hoy`}
      className="shrink-0"
    >
      <circle cx={centro} cy={centro} r={radio} fill="none" stroke="var(--papel-hundido)" strokeWidth={grosor} />
      {ratio > 0 && (
        <circle
          cx={centro}
          cy={centro}
          r={radio}
          fill="none"
          stroke={cumplido ? "var(--pino)" : "var(--subrayador)"}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={`${circunferencia * ratio} ${circunferencia}`}
          transform={`rotate(-90 ${centro} ${centro})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      )}
      <text
        x={centro}
        y={centro + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={tamano * 0.27}
        fontWeight="800"
        fill="currentColor"
      >
        {cumplido ? "✓" : hecho}
      </text>
    </svg>
  );
}
