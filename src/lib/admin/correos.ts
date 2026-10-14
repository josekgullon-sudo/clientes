const DEFECTO = "josekgullon@gmail.com";

/** Correos con acceso a /admin. Varios, separados por comas. Vacío o ausente usa el defecto. */
export function parsearCorreos(bruto: string | undefined): string[] {
  const texto = bruto?.trim() ? bruto : DEFECTO;
  const correos = [...new Set(texto.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
  return correos.length > 0 ? correos : [DEFECTO];
}
