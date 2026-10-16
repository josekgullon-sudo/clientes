const MAX = 2000;

/** Texto de una nota interna. Null si está vacío o pasa de 2000 caracteres. */
export function notaValida(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  const texto = bruto.replace(/\u0000/g, "").trim();
  if (!texto || texto.length > MAX) return null;
  return texto;
}
