import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Cliente con la sesión del usuario (respeta RLS). */
export async function supabaseServidor() {
  const almacen = await cookies();
  return createServerClient(url(), anon(), {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) almacen.set(name, value, options);
        } catch {
          // Desde un Server Component no se pueden escribir cookies; el proxy refresca la sesión.
        }
      },
    },
  });
}

/** Cliente anónimo sin cookies, para páginas públicas que se pueden cachear. */
export function supabasePublico() {
  return createClient(url(), anon(), { auth: { persistSession: false } });
}

/** Cliente con service role. Solo para webhooks y tareas de servidor: se salta RLS. */
export function supabaseAdmin() {
  return createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
