import "server-only";
import { claimsActuales } from "@/lib/datos/usuario";
import { parsearCorreos } from "./correos";

export function correosAdmin(): string[] {
  return parsearCorreos(process.env.ADMIN_EMAILS);
}

function correoDe(claims: { email?: unknown; user_metadata?: unknown } | null): string {
  if (!claims) return "";
  if (typeof claims.email === "string" && claims.email.includes("@")) return claims.email.toLowerCase();
  const meta = claims.user_metadata;
  if (meta && typeof meta === "object" && "email" in meta) {
    const email = (meta as { email?: unknown }).email;
    if (typeof email === "string" && email.includes("@")) return email.toLowerCase();
  }
  return "";
}

/** True solo si hay sesión y el correo está en ADMIN_EMAILS. */
export async function esAdmin(): Promise<boolean> {
  const email = correoDe(await claimsActuales());
  if (!email) return false;
  return correosAdmin().includes(email);
}
