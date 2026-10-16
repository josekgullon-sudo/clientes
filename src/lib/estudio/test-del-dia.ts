import { createHash } from "node:crypto";

export type CandidataDia = { id: string; tema: string };

function firma(texto: string) {
  return createHash("md5").update(texto).digest("hex");
}

/**
 * Las mismas 10 preguntas para todo el mundo, ese día y esa oposición.
 * Primero una de cada tema, en un orden fijo por la fecha. Sin azar.
 */
export function elegirTestDelDia(candidatas: CandidataDia[], dia: string, n = 10): string[] {
  const porTema = new Map<string, CandidataDia[]>();
  for (const candidata of candidatas) {
    const lista = porTema.get(candidata.tema) ?? [];
    lista.push(candidata);
    porTema.set(candidata.tema, lista);
  }

  const ordenadas: { id: string; turno: number; temaOrden: string; idOrden: string }[] = [];
  for (const [tema, lista] of porTema) {
    const temaOrden = firma(`${dia}:${tema}`);
    const porId = [...lista].sort(
      (a, b) => firma(`${dia}:${a.id}`).localeCompare(firma(`${dia}:${b.id}`)) || a.id.localeCompare(b.id),
    );
    porId.forEach((candidata, indice) => {
      ordenadas.push({
        id: candidata.id,
        turno: indice + 1,
        temaOrden,
        idOrden: firma(`${dia}:${candidata.id}`),
      });
    });
  }

  ordenadas.sort(
    (a, b) => a.turno - b.turno || a.temaOrden.localeCompare(b.temaOrden) || a.idOrden.localeCompare(b.idOrden),
  );
  return ordenadas.slice(0, n).map((fila) => fila.id);
}
