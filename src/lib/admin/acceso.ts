import "server-only";
import { claimsActuales } from "@/lib/datos/usuario";
import { correoDeClaims, esCorreoAdmin, parsearCorreos } from "./correos";

export function correosAdmin(): string[] {
  return parsearCorreos(process.env.ADMIN_EMAILS);
}

/** True solo si hay sesión y el correo está en ADMIN_EMAILS. */
export async function esAdmin(): Promise<boolean> {
  return esCorreoAdmin(correoDeClaims(await claimsActuales()), correosAdmin());
}
