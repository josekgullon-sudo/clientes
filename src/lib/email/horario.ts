export const TIPOS_EMAIL = [
  "bienvenida",
  "racha",
  "reenganche_3",
  "reenganche_7",
  "sin_test",
  "tope",
  "resumen",
] as const;

export type TipoEmail = (typeof TIPOS_EMAIL)[number];

export const NOMBRES_EMAIL: Record<TipoEmail, string> = {
  bienvenida: "Bienvenida",
  racha: "Recordatorio de racha",
  reenganche_3: "Reenganche a los 3 días",
  reenganche_7: "Reenganche a los 7 días",
  sin_test: "Registrado sin test",
  tope: "Tope gratis",
  resumen: "Resumen semanal",
};

export type RelojMadrid = {
  hora: number;
  dia: string;
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
};

export function relojMadrid(ahora = new Date()): RelojMadrid {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(ahora);
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  const hora = mapa.hour === "24" ? 0 : Number(mapa.hour);
  const diaSemana = mapa.weekday;
  return {
    hora,
    dia: `${mapa.year}-${mapa.month}-${mapa.day}`,
    lunes: diaSemana === "Mon",
    martes: diaSemana === "Tue",
    miercoles: diaSemana === "Wed",
  };
}

/** De 9:00 a 21:00, hora de Madrid. A las 21:00 ya no se envía. */
export function enVentana(reloj: RelojMadrid): boolean {
  return reloj.hora >= 9 && reloj.hora < 21;
}

export function esTipoEmail(valor: string): valor is TipoEmail {
  return (TIPOS_EMAIL as readonly string[]).includes(valor);
}

/** El aviso de Premium no sale si ya paga. */
export function filtrarTipos(tipos: TipoEmail[], premium: boolean): TipoEmail[] {
  return premium ? tipos.filter((t) => t !== "tope") : tipos;
}

/**
 * Un correo por persona. El cron es diario, a las 16:00 UTC
 * (17:00 en Madrid en invierno y 18:00 en verano). La racha sale
 * desde las 17:00; si la hora es anterior, reserva el hueco del día.
 * El resumen sale de lunes a miércoles cuando no hay racha pendiente.
 */
export function elegirEnvio(tipos: TipoEmail[], reloj: RelojMadrid): TipoEmail | null {
  const tiene = (t: TipoEmail) => tipos.includes(t);
  if (tiene("bienvenida")) return "bienvenida";
  if (tiene("tope")) return "tope";
  if (tiene("sin_test")) return "sin_test";
  if (tiene("racha") && reloj.hora < 17) return null;
  if (tiene("racha") && reloj.hora >= 17 && reloj.hora < 21) return "racha";
  if (tiene("reenganche_7")) return "reenganche_7";
  if (tiene("reenganche_3")) return "reenganche_3";
  if (tiene("resumen") && (reloj.lunes || reloj.martes || reloj.miercoles)) return "resumen";
  return null;
}
