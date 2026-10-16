import type { Metadata } from "next";
import Link from "next/link";
import { leerBaja } from "@/lib/email/token";
import { SITIO } from "@/lib/sitio";
import { supabaseAdmin } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Baja de avisos",
  robots: { index: false, follow: false },
};

async function aplicar(token: string) {
  if (token === "vista") return "vista" as const;
  const id = leerBaja(token, process.env.CRON_SECRET ?? "");
  if (!id) return "invalido" as const;
  const admin = supabaseAdmin();
  const { error } = await admin.from("preferencias_email").upsert({
    usuario_id: id,
    avisos: false,
    actualizado_en: new Date().toISOString(),
  });
  if (error) return "invalido" as const;
  await admin.from("perfil_estudio").update({ recordatorio_email: false }).eq("usuario_id", id);
  return "ok" as const;
}

export default async function Baja({ searchParams }: PageProps<"/baja">) {
  const q = await searchParams;
  const token = typeof q.t === "string" ? q.t : "";
  const estado = token ? await aplicar(token) : "invalido";

  const titulo = estado === "ok" ? "Listo, no te escribimos más" : estado === "vista" ? "Así se ve la baja" : "Este enlace no vale";
  const texto =
    estado === "ok"
      ? "Hemos apagado los avisos de estudio. El correo para entrar en tu cuenta sigue llegando."
      : estado === "vista"
        ? "Esto es una vista previa. No hemos cambiado tus avisos."
        : "Pide otro desde el último correo o apaga el recordatorio en tu cuenta.";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-16">
      <p className="antetitulo">{SITIO.nombre}</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">{titulo}</h1>
      <p className="mt-3 text-pizarra">{texto}</p>
      <Link href="/app" className="enlace mt-6">
        Volver a estudiar
      </Link>
    </main>
  );
}
