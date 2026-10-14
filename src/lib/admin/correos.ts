const DEFECTO = "josekgullon@gmail.com";

/** Correos con acceso a /admin. Varios, separados por comas. */
export function parsearCorreos(bruto: string | undefined): string[] {
  const texto = bruto?.trim() ? bruto : DEFECTO;
  return [...new Set(texto.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
}
