/**
 * Clara, la mascota: un rotulador fluorescente con capuchón verde.
 * Es la seña de identidad de Oposiciones Claras (el subrayado) y acompaña al
 * opositor en cada paso: saluda, celebra, anima tras un fallo, piensa o duerme.
 * SVG puro, sin imágenes externas. Los colores son de marca y no cambian con el tema.
 */

export type PoseClara = "hola" | "feliz" | "celebra" | "animo" | "piensa" | "duerme" | "premium" | "senala";

const C = {
  cuerpo: "#FACC15",
  sombra: "#EAB308",
  capuchon: "#15803D",
  capuchonOscuro: "#116632",
  tinta: "#1A2620",
  mejilla: "#FB7185",
  oro: "#F59E0B",
};

type Brazo = "abajo" | "arriba" | "saluda" | "senala" | "cintura";

const brazos: Record<PoseClara, [Brazo, Brazo]> = {
  hola: ["abajo", "saluda"],
  feliz: ["abajo", "abajo"],
  celebra: ["arriba", "arriba"],
  animo: ["cintura", "arriba"],
  piensa: ["abajo", "cintura"],
  duerme: ["abajo", "abajo"],
  premium: ["arriba", "arriba"],
  senala: ["abajo", "senala"],
};

function trazoBrazo(lado: "izq" | "der", b: Brazo) {
  // Coordenadas del brazo izquierdo; el derecho se refleja sobre x = 60.
  const caminos: Record<Brazo, { d: string; mano: [number, number] }> = {
    abajo: { d: "M31 94 q-9 7 -11 17", mano: [20, 112] },
    arriba: { d: "M31 84 q-13 -8 -15 -24", mano: [16, 59] },
    saluda: { d: "M31 86 q-15 -6 -17 -22", mano: [14, 63] },
    senala: { d: "M31 92 q-12 0 -22 -4", mano: [9, 88] },
    cintura: { d: "M31 92 q-12 2 -8 12", mano: [24, 104] },
  };
  const c = caminos[b];
  const espejo = lado === "der" ? "translate(120 0) scale(-1 1)" : undefined;
  // El giro del saludo va en un grupo interior para no mezclarse con el reflejo.
  return (
    <g transform={espejo}>
      <g className={b === "saluda" ? "clara-saluda" : undefined}>
        <path d={c.d} fill="none" stroke={C.sombra} strokeWidth="7" strokeLinecap="round" />
        <circle cx={c.mano[0]} cy={c.mano[1]} r="5" fill={C.cuerpo} stroke={C.sombra} strokeWidth="2" />
      </g>
    </g>
  );
}

function Ojos({ pose }: { pose: PoseClara }) {
  if (pose === "duerme") {
    return (
      <g stroke={C.tinta} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M41 74 q7 5 14 0" />
        <path d="M65 74 q7 5 14 0" />
      </g>
    );
  }
  if (pose === "celebra" || pose === "feliz" || pose === "premium") {
    return (
      <g stroke={C.tinta} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M41 75 q7 -9 14 0" />
        <path d="M65 75 q7 -9 14 0" />
      </g>
    );
  }
  const mira = pose === "piensa" ? [-1.5, -3] : pose === "senala" ? [2.5, 0] : [0.5, 0.5];
  return (
    <g className="clara-ojos">
      {[48, 72].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="72" rx="8.5" ry="10" fill="#fff" />
          <circle cx={x + mira[0]} cy={72 + mira[1]} r="4.6" fill={C.tinta} />
          <circle cx={x + mira[0] + 1.6} cy={72 + mira[1] - 1.8} r="1.5" fill="#fff" />
        </g>
      ))}
      {pose === "animo" && (
        <g stroke={C.tinta} strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M41 59 q7 -5 13 -1" />
          <path d="M79 59 q-7 -5 -13 -1" />
        </g>
      )}
    </g>
  );
}

function Boca({ pose }: { pose: PoseClara }) {
  switch (pose) {
    case "celebra":
    case "premium":
    case "hola":
      return (
        <g>
          <path d="M49 84 q11 17 22 0 z" fill={C.tinta} />
          <path d="M54 91 q6 4.5 12 0 q-6 -3.5 -12 0z" fill={C.mejilla} />
        </g>
      );
    case "piensa":
      return <ellipse cx="62" cy="89" rx="3.2" ry="4" fill={C.tinta} />;
    case "duerme":
      return <path d="M55 88 q5 3 10 0" stroke={C.tinta} strokeWidth="2.8" fill="none" strokeLinecap="round" />;
    case "animo":
      return <path d="M51 86 q9 9 18 0" stroke={C.tinta} strokeWidth="3.2" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M51 85 q9 9 18 0" stroke={C.tinta} strokeWidth="3.2" fill="none" strokeLinecap="round" />;
  }
}

export function Clara({
  pose = "hola",
  className = "size-28",
  animada = true,
  saludoInfinito = false,
  titulo,
}: {
  pose?: PoseClara;
  className?: string;
  /** Rebote al aparecer, respiración, parpadeo y saludo. Respeta prefers-reduced-motion. */
  animada?: boolean;
  /** La mano no deja de saludar (portada, pantallas de bienvenida). */
  saludoInfinito?: boolean;
  /** Texto alternativo. Sin él la ilustración es decorativa. */
  titulo?: string;
}) {
  const [izq, der] = brazos[pose];
  return (
    <svg
      viewBox="0 0 120 150"
      className={`${className} ${animada ? "clara-anima" : ""} ${saludoInfinito ? "clara-saludo-infinito" : ""} overflow-visible`}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      {/* Sombra en el suelo */}
      <ellipse cx="60" cy="140" rx="30" ry="5" fill={C.tinta} opacity="0.12" />

      <g className="clara-respira">
      {/* Pies */}
      <ellipse cx="47" cy="133" rx="9" ry="5.5" fill={C.capuchon} />
      <ellipse cx="73" cy="133" rx="9" ry="5.5" fill={C.capuchon} />

      {trazoBrazo("izq", izq)}
      {trazoBrazo("der", der)}

      {/* Cuerpo del rotulador */}
      <rect x="28" y="38" width="64" height="94" rx="26" fill={C.cuerpo} />
      <path d="M78 42 q14 6 14 26 v38 q0 22 -18 25 q12 -10 12 -30 v-34 q0 -18 -8 -25z" fill={C.sombra} opacity="0.55" />
      <rect x="36" y="52" width="7" height="46" rx="3.5" fill="#fff" opacity="0.45" />

      {/* Capuchón */}
      <rect x="30" y="14" width="60" height="36" rx="17" fill={C.capuchon} />
      <rect x="30" y="38" width="60" height="9" fill={C.capuchonOscuro} />
      <rect x="80" y="17" width="6" height="28" rx="3" fill={C.capuchonOscuro} />
      <rect x="38" y="20" width="16" height="5" rx="2.5" fill="#fff" opacity="0.3" />

      {pose === "premium" && (
        <path d="M38 18 l5 -17 l9 10 l8 -13 l8 13 l9 -10 l5 17 z" fill={C.oro} stroke="#B45309" strokeWidth="1.8" strokeLinejoin="round" />
      )}

      {/* Cara */}
      <Ojos pose={pose} />
      <ellipse cx="38" cy="85" rx="5.5" ry="3.3" fill={C.mejilla} opacity="0.55" />
      <ellipse cx="82" cy="85" rx="5.5" ry="3.3" fill={C.mejilla} opacity="0.55" />
      <Boca pose={pose} />

      {/* Trazo de subrayador en la barriga */}
      <rect x="44" y="106" width="32" height="7" rx="3.5" fill={C.capuchon} opacity="0.85" />

      </g>

      {pose === "duerme" && (
        <g fill={C.tinta} fontFamily="sans-serif" fontWeight="800" className="clara-zeta">
          <text x="94" y="30" fontSize="14">z</text>
          <text x="104" y="16" fontSize="10">z</text>
        </g>
      )}
      {pose === "piensa" && (
        <g>
          <circle cx="100" cy="22" r="13" fill="#fff" stroke={C.tinta} strokeWidth="2" />
          <text x="100" y="28" textAnchor="middle" fontSize="16" fontWeight="900" fill={C.tinta} fontFamily="sans-serif">
            ?
          </text>
          <circle cx="88" cy="40" r="3" fill="#fff" stroke={C.tinta} strokeWidth="1.5" />
        </g>
      )}
      {(pose === "celebra" || pose === "premium") && (
        <g className="clara-brillos">
          <path d="M10 30 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5z" fill={C.oro} />
          <path d="M108 44 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" fill="#38BDF8" />
          <circle cx="104" cy="8" r="3" fill={C.mejilla} />
          <circle cx="16" cy="10" r="2.5" fill="#4ADE80" />
        </g>
      )}
    </svg>
  );
}
