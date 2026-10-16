"use server";

import { redirect } from "next/navigation";
import { esAdmin } from "@/lib/admin/acceso";
import { correoDeClaims } from "@/lib/admin/correos";
import { claimsActuales } from "@/lib/datos/usuario";
import { enviarPrueba } from "@/lib/email/enviar";
import { esTipoEmail } from "@/lib/email/horario";

export async function enviarCorreoPrueba(datos: FormData) {
  if (!(await esAdmin())) redirect("/admin/emails?error=permiso");
  const tipo = String(datos.get("tipo") ?? "");
  if (!esTipoEmail(tipo)) redirect("/admin/emails?error=tipo");
  if (!process.env.RESEND_API_KEY) redirect("/admin/emails?error=resend");
  const email = correoDeClaims(await claimsActuales());
  if (!email) redirect("/admin/emails?error=correo");
  const ok = await enviarPrueba(email, tipo);
  redirect(ok ? `/admin/emails?enviado=${tipo}` : "/admin/emails?error=envio");
}
