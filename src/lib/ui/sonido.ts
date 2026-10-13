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

export const sonidos = {
  acierto: () => notas([659.25, 987.77], { paso: 0.08, duracion: 0.25 }),
  fallo: () => notas([311.13, 233.08], { paso: 0.12, duracion: 0.28, tipo: "triangle", volumen: 0.09 }),
  fin: () => notas([523.25, 659.25, 783.99, 1046.5], { paso: 0.1, duracion: 0.35 }),
  tic: () => notas([1318.5], { duracion: 0.06, volumen: 0.05, tipo: "square" }),
  salida: () => notas([392, 523.25], { paso: 0.12, duracion: 0.2 }),
};
