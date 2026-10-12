export function Anillo({ hecho, objetivo }: { hecho: number; objetivo: number }) {
  const radio = 28;
  const circunferencia = 2 * Math.PI * radio;
  const ratio = objetivo > 0 ? Math.min(1, hecho / objetivo) : 0;
  const cumplido = hecho >= objetivo && objetivo > 0;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`${hecho} de ${objetivo} preguntas hoy`}>
      <circle cx="38" cy="38" r={radio} fill="none" stroke="var(--filete)" strokeWidth="7" />
      <circle
        cx="38"
        cy="38"
        r={radio}
        fill="none"
        stroke={cumplido ? "var(--pino)" : "var(--subrayador)"}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${circunferencia * ratio} ${circunferencia}`}
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="42" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">
        {hecho}
      </text>
    </svg>
  );
}
