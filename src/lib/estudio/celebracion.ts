export const HITOS_RACHA = [3, 7, 14, 30, 50, 100, 365] as const;

export type MetaSesion = {
  xp?: number;
  racha?: number;
  racha_nueva?: boolean;
  objetivo_cumplido?: boolean;
  recien_cumplido?: boolean;
  nivel_subido?: boolean;
  corona?: string | null;
  logros?: string[];
  seguidas?: number;
};

export function frasesCelebracion(meta: MetaSesion | null | undefined) {
  if (!meta) return [];
  const frases: string[] = [];
  if (meta.recien_cumplido) frases.push("Objetivo de hoy cumplido. Mañana la racha sigue.");
  if (meta.nivel_subido) frases.push("Has subido de nivel en este tema.");
  if (meta.corona === "oro") frases.push("Corona de oro. El examen del tema te ha salido alto.");
  else if (meta.corona) frases.push("Corona de plata. El tema queda cerrado.");
  if (meta.racha_nueva && meta.racha && (HITOS_RACHA as readonly number[]).includes(meta.racha)) {
    frases.push(`Racha de ${meta.racha} días. Eso ya es un hábito.`);
  }
  if ((meta.seguidas ?? 0) >= 10) frases.push("Diez aciertos seguidos en este test.");
  return frases;
}

export function hayCelebracion(meta: MetaSesion | null | undefined) {
  if (!meta) return false;
  return Boolean(
    meta.recien_cumplido ||
      meta.nivel_subido ||
      meta.corona ||
      (meta.racha_nueva && meta.racha && (HITOS_RACHA as readonly number[]).includes(meta.racha)) ||
      (meta.logros && meta.logros.length > 0),
  );
}
