"use server";

import { revalidatePath } from "next/cache";
import { esAdmin } from "@/lib/admin/acceso";
import { notaValida } from "@/lib/admin/notas";
import { esUuid } from "@/lib/admin/personas";
import { claimsActuales } from "@/lib/datos/usuario";
import { supabaseAdmin } from "@/lib/supabase/servidor";

export async function guardarNota(usuarioId: string, form: FormData) {
  if (!(await esAdmin())) return;
  if (!esUuid(usuarioId)) return;
  const texto = notaValida(form.get("texto"));
  if (!texto) return;
  const claims = await claimsActuales();
  const adminId = typeof claims?.sub === "string" && esUuid(claims.sub) ? claims.sub : null;
  const { error } = await supabaseAdmin().from("notas_admin").insert({
    usuario_id: usuarioId,
    admin_id: adminId,
    texto,
  });
  if (error) {
    console.error("nota admin", error.message);
    return;
  }
  revalidatePath(`/admin/usuarios/${usuarioId}`);
}
