/**
 * Activa una suscripción de prueba de 30 días, sin Stripe. Solo contra Supabase local.
 *
 *   npm run local:suscribir -- tu@correo.es
 */
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile?.(".env.local");

const email = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!email) {
  console.error("Indica el correo: npm run local:suscribir -- tu@correo.es");
  process.exit(1);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
  console.error("Solo se puede usar contra Supabase local");
  process.exit(1);
}

const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const usuario = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!usuario) {
    console.error(`No hay ninguna cuenta con ${email}. Entra antes en la web con ese correo.`);
    process.exit(1);
  }
  const fin = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const { error: e } = await db
    .from("suscripciones")
    .upsert({ usuario_id: usuario.id, plan: "mensual", estado: "active", fin_periodo: fin }, { onConflict: "usuario_id" });
  if (e) throw e;
  console.log(`Suscripción de prueba activa para ${email} hasta ${fin.slice(0, 10)}. Recarga la web.`);
}

main();
