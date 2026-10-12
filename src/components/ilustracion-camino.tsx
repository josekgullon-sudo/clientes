/** Mockup del camino: nodos, racha y una figura geométrica. Sin personajes infantiles. */
export function IlustracionCamino() {
  return (
    <svg viewBox="0 0 420 460" className="mx-auto w-full max-w-md drop-shadow-xl" role="img" aria-label="Camino de temas con racha de 12 días">
      <rect x="24" y="16" width="372" height="428" rx="32" fill="var(--papel)" stroke="var(--filete)" />
      <rect x="40" y="40" width="168" height="64" rx="18" fill="var(--teja-suave)" />
      <circle cx="68" cy="72" r="16" fill="var(--teja)" />
      <path d="M68 64c1.2 4 5 5.2 5 9a5 5 0 1 1-10 0c0-3.8 3.8-5 5-9z" fill="var(--papel)" />
      <text x="92" y="66" fontSize="13" fontWeight="700" fill="var(--tinta)">Racha</text>
      <text x="92" y="88" fontSize="16" fontWeight="700" fill="var(--tinta)">12 días</text>

      <rect x="220" y="40" width="156" height="64" rx="18" fill="var(--pino-suave)" />
      <text x="240" y="66" fontSize="13" fontWeight="700" fill="var(--pino)">Hoy</text>
      <text x="240" y="90" fontSize="18" fontWeight="700" fill="var(--tinta)">4 / 10</text>

      <path d="M210 150 V360" stroke="var(--filete)" strokeWidth="4" strokeLinecap="round" />
      {[
        [150, "1", "var(--pino-boton)", "var(--sobre-pino)", "Constitución"],
        [230, "2", "var(--papel)", "var(--tinta)", "La Corona"],
        [310, "★", "var(--subrayador)", "var(--subrayador-texto)", "El Gobierno"],
      ].map(([y, n, fondo, tinta, titulo]) => (
        <g key={String(y)}>
          <circle cx="210" cy={Number(y)} r="28" fill={String(fondo)} stroke="var(--pino-boton)" strokeWidth="3" />
          <text x="210" y={Number(y) + 6} textAnchor="middle" fontSize="16" fontWeight="700" fill={String(tinta)}>{n}</text>
          <text x="252" y={Number(y) + 6} fontSize="15" fontWeight="650" fill="var(--tinta)">{titulo}</text>
        </g>
      ))}

      <g transform="translate(300 300)">
        <circle cx="36" cy="28" r="26" fill="var(--pino-suave)" />
        <circle cx="36" cy="22" r="10" fill="var(--pino)" />
        <path d="M16 58c2-14 12-20 20-20s18 6 20 20" fill="var(--pino)" />
      </g>
    </svg>
  );
}
