import { redirect } from "next/navigation";
import { registrarEvento } from "@/lib/crm/eventos";
import { slugOposicion } from "@/lib/datos/usuario";
import { supabaseServidor } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

/** Abre un test de 10 preguntas del primer tema. El enlace de los correos llega aquí. */
export default async function Diez() {
  const supabase = await supabaseServidor();
  const { data: temas } = await supabase.rpc("progreso_por_tema", { p_oposicion: null });
  const tema = ((temas ?? []) as { tema_id: string; total: number }[]).find((t) => t.total > 0)?.tema_id ?? "";
  if (!/^[0-9a-f-]{36}$/.test(tema)) redirect("/app");

  const { data, error } = await supabase.rpc("crear_intento", {
    p_oposicion: await slugOposicion(),
    p_modo: "tema",
    p_temas: [tema],
    p_num: 10,
  });
  if (error?.message.includes("cuota_agotada")) {
    await registrarEvento("limite_gratis", { motivo: "cuota" });
    redirect("/suscripcion?motivo=cuota");
  }
  if (error || !data) redirect("/app");
  await registrarEvento("test_inicio", { modo: "tema", intento: String(data) });
  redirect(`/app/test/${data}`);
}
