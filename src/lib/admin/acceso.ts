import "server-only";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { parsearCorreos } from "./correos";

export function correosAdmin(): string[] {
  return parsearCorreos(process.env.ADMIN_EMAILS);
}

/** True solo si hay sesión y el correo está en ADMIN_EMAILS. */
export async function esAdmin(): Promise<boolean> {
  try {
    const supabase = await supabaseServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email?.toLowerCase();
    if (!email) return false;
    return correosAdmin().includes(email);
  } catch {
    return false;
  }
}
