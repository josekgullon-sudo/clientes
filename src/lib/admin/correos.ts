const DEFECTO = "josekgullon@gmail.com";

/** Correo de la sesión, en minúsculas. Vacío si no hay uno usable. */
export function correoDeClaims(claims: { email?: unknown; user_metadata?: unknown } | null): string {
  if (!claims) return "";
  if (typeof claims.email === "string" && claims.email.includes("@")) return claims.email.toLowerCase();
  const meta = claims.user_metadata;
  if (meta && typeof meta === "object" && "email" in meta) {
    const email = (meta as { email?: unknown }).email;
    if (typeof email === "string" && email.includes("@")) return email.toLowerCase();
  }
  return "";
}

/** True si ese correo está en la lista de administración. */
export function esCorreoAdmin(email: string, correos: string[]): boolean {
  if (!email.includes("@")) return false;
  return correos.includes(email);
}

/** Correos con acceso a /admin. Varios, separados por comas. Vacío o ausente usa el defecto. */
export function parsearCorreos(bruto: string | undefined): string[] {
  const texto = bruto?.trim() ? bruto : DEFECTO;
  const correos = [...new Set(texto.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
  return correos.length > 0 ? correos : [DEFECTO];
}
