/** Camino geométrico: nodos, una llama y una corona. Sin personajes. */
export function IlustracionCamino() {
  return (
    <svg viewBox="0 0 320 220" className="w-full max-w-sm" role="img" aria-label="Camino de temas con racha y corona">
      <rect x="8" y="8" width="304" height="204" rx="20" fill="var(--papel-hundido)" />
      <path d="M64 48 V172" stroke="var(--filete)" strokeWidth="3" />
      {[
        [48, "1", "var(--pino-boton)", "var(--sobre-pino)"],
        [96, "2", "var(--pino-boton)", "var(--sobre-pino)"],
        [144, "3", "var(--papel)", "var(--tinta)"],
      ].map(([y, n, fondo, tinta]) => (
        <g key={String(y)}>
          <circle cx="64" cy={Number(y)} r="16" fill={String(fondo)} stroke="var(--pino-boton)" strokeWidth="2" />
          <text x="64" y={Number(y) + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill={String(tinta)}>
            {n}
          </text>
          <rect x="96" y={Number(y) - 10} width="150" height="12" rx="6" fill="var(--filete)" />
          <rect x="96" y={Number(y) + 8} width={y === 144 ? 70 : 110} height="8" rx="4" fill="var(--pino)" opacity={y === 144 ? 0.35 : 0.8} />
        </g>
      ))}
      <g transform="translate(228 36)">
        <circle cx="28" cy="28" r="26" fill="var(--subrayador)" />
        <path d="M28 14c2 6 8 8 8 14a8 8 0 1 1-16 0c0-6 6-8 8-14z" fill="var(--teja)" />
        <text x="28" y="78" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--tinta)">
          12 días
        </text>
      </g>
    </svg>
  );
}
