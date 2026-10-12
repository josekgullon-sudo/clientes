/** SM-2 simplificado. Los intervalos base son 1, 3, 7, 16 y 35, ajustados por la facilidad. */

export type Tarjeta = {
  intervalo: number;
  facilidad: number;
  repeticiones: number;
};

export function revisar(tarjeta: Tarjeta, acierto: boolean): Tarjeta {
  if (!acierto) {
    return {
      intervalo: 1,
      facilidad: Math.max(1.3, Math.round((tarjeta.facilidad - 0.2) * 100) / 100),
      repeticiones: 0,
    };
  }
  const secuencia = [1, 3, 7, 16, 35];
  const base = secuencia[Math.min(tarjeta.repeticiones, secuencia.length - 1)];
  return {
    intervalo: Math.max(1, Math.round(base * (tarjeta.facilidad / 2.5))),
    facilidad: Math.min(3, Math.round((tarjeta.facilidad + 0.1) * 100) / 100),
    repeticiones: tarjeta.repeticiones + 1,
  };
}

export function dominada(intervalo: number) {
  return intervalo >= 21;
}

export function calcularXp(input: {
  aciertos: number;
  fallos: number;
  modo: string;
  total: number;
  nivelSubido: boolean;
}) {
  let xp = input.aciertos * 10 + input.fallos * 2;
  if (input.modo === "falladas" || input.modo === "repaso") xp = Math.round(xp * 1.5);
  if ((input.modo === "tema" || input.modo === "leccion") && input.total > 0 && input.aciertos === input.total) xp += 20;
  if (input.nivelSubido) xp += 50;
  if (input.modo === "simulacro") xp += 150;
  return xp;
}
