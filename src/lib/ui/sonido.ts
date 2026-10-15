/**
 * Sonidos cortos sintetizados con Web Audio (sin archivos): un acorde alegre al
 * acertar, un tono suave al fallar y una fanfarria al terminar. Se pueden
 * silenciar; la preferencia se guarda en el dispositivo.
 */
const CLAVE = "sonido";
let ctx: AudioContext | null = null;

export function sonidoActivo() {
  try {
    return localStorage.getItem(CLAVE) !== "0";
  } catch {
    return true;
  }
}

export function guardarSonido(activo: boolean) {
  try {
    localStorage.setItem(CLAVE, activo ? "1" : "0");
  } catch {
    /* sin almacenamiento */
  }
}

function notas(frecuencias: number[], { paso = 0.09, duracion = 0.22, tipo = "sine" as OscillatorType, volumen = 0.12 } = {}) {
  if (typeof window === "undefined" || !sonidoActivo()) return;
  try {
    ctx ??= new AudioContext();
    const ahora = ctx.currentTime;
    frecuencias.forEach((f, i) => {
      const osc = ctx!.createOscillator();
      const gan = ctx!.createGain();
      osc.type = tipo;
      osc.frequency.value = f;
      const t = ahora + i * paso;
      gan.gain.setValueAtTime(0, t);
      gan.gain.linearRampToValueAtTime(volumen, t + 0.015);
      gan.gain.exponentialRampToValueAtTime(0.001, t + duracion);
      osc.connect(gan).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + duracion + 0.02);
    });
  } catch {
    /* sin audio: no pasa nada */
  }
}

// Escala mayor desde sol5, en semitonos: cada acierto seguido sube un escalón. Empieza aguda
// para que se oiga bien en el altavoz del móvil, que apenas reproduce los graves.
const ESCALA = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];
const tono = (semitonos: number) => 783.99 * 2 ** (semitonos / 12);

/** Notas del acierto número `racha` seguido: «turín» cada vez más agudo y con remate en 5 y 10. */
export function notasAcierto(racha = 1): number[] {
  const n = Math.max(1, Math.floor(racha));
  const s = ESCALA[Math.min(n, ESCALA.length) - 1];
  const turin = [tono(s), tono(s + 7)];
  if (n === 5 || n === 10 || (n > 10 && n % 5 === 0)) return [...turin, tono(s + 12), tono(s + 19)];
  return turin;
}

export const sonidos = {
  /** `racha`: aciertos seguidos contando este (1 si no se lleva la cuenta). */
  // Triángulo y más volumen al principio: los tonos agudos ya suenan más fuertes por sí solos.
  acierto: (racha = 1) =>
    notas(notasAcierto(racha), {
      paso: racha >= 5 ? 0.07 : 0.08,
      duracion: 0.28,
      tipo: "triangle",
      volumen: Math.max(0.2, 0.32 - Math.min(racha, 12) * 0.01),
    }),
  fallo: () => notas([311.13, 233.08], { paso: 0.12, duracion: 0.28, tipo: "triangle", volumen: 0.09 }),
  fin: () => notas([523.25, 659.25, 783.99, 1046.5], { paso: 0.1, duracion: 0.35 }),
  tic: () => notas([1318.5], { duracion: 0.06, volumen: 0.05, tipo: "square" }),
  salida: () => notas([392, 523.25], { paso: 0.12, duracion: 0.2 }),
};
