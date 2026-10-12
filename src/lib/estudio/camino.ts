export type NodoCamino = {
  tema_id: string;
  numero: number;
  titulo: string;
  bloque: string;
  total: number;
  nivel: number;
  lecciones: number;
  corona: "plata" | "oro" | null;
};

/** Siguiente lección que esta cuenta puede hacer. El nivel 3 o más queda fuera del plan gratis. */
export function siguienteLeccion(temas: NodoCamino[], premium: boolean) {
  const orden = [...temas].sort((a, b) => a.numero - b.numero);
  return (
    orden.find((t) => {
      if (t.total <= 0 || t.corona) return false;
      const nivel = t.nivel > 0 ? t.nivel : 1;
      return premium || nivel < 3;
    }) ?? null
  );
}

export function siguienteBloqueado(temas: NodoCamino[], premium: boolean) {
  if (premium) return null;
  const abierto = siguienteLeccion(temas, false);
  if (abierto) return null;
  return (
    [...temas]
      .sort((a, b) => a.numero - b.numero)
      .find((t) => t.total > 0 && !t.corona && (t.nivel > 0 ? t.nivel : 1) >= 3) ?? null
  );
}

export function preguntasDeLeccion(nodo: NodoCamino) {
  const nivel = nodo.nivel > 0 ? nodo.nivel : 1;
  return nivel >= 5 ? 20 : 10;
}

export function minutosDeLeccion(preguntas: number) {
  if (preguntas <= 5) return 3;
  if (preguntas >= 20) return 10;
  return 5;
}

export function nivelVisible(nodo: NodoCamino) {
  return nodo.nivel > 0 ? nodo.nivel : 1;
}
