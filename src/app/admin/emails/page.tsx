import type { Metadata } from "next";
import { MarcoAdmin } from "@/components/admin/marco";
import { NOMBRES_EMAIL, TIPOS_EMAIL } from "@/lib/email/horario";
import { plantilla, muestra } from "@/lib/email/plantillas";
import { SITIO } from "@/lib/sitio";
import { enviarCorreoPrueba } from "./acciones";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Correos",
  robots: { index: false, follow: false },
};

const AVISOS: Record<string, string> = {
  resend: "Falta RESEND_API_KEY en Vercel. Sin esa variable no se envía nada.",
  envio: "Resend no ha aceptado el envío. Revisa la clave y que el dominio esté verificado.",
  correo: "Tu sesión no tiene correo.",
  permiso: "No tienes acceso.",
  tipo: "Ese aviso no existe.",
};

export default async function PaginaCorreos({ searchParams }: PageProps<"/admin/emails">) {
  const q = await searchParams;
  const error = typeof q.error === "string" ? AVISOS[q.error] : "";
  const enviado = typeof q.enviado === "string" ? q.enviado : "";
  const origen = (process.env.NEXT_PUBLIC_SITE_URL ?? SITIO.url).replace(/\/$/, "");
  const baja = `${origen}/baja?t=vista`;

  return (
    <MarcoAdmin activo="correos">
      <p className="antetitulo mt-8">Correos</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Así se ven los avisos</h1>
      <p className="mt-2 max-w-xl text-pizarra">
        La prueba llega a tu correo, con el asunto marcado. No se anota en la ficha de nadie.
      </p>
      {!process.env.RESEND_API_KEY && (
        <p className="mt-4 rounded-2xl border-2 border-filete bg-oro-suave px-4 py-3 text-sm font-semibold text-oro-texto">
          Añade RESEND_API_KEY en Vercel para poder enviar.
        </p>
      )}
      {error && <p className="mt-4 text-teja">{error}</p>}
      {enviado && <p className="mt-4 font-semibold text-pino">Prueba enviada: {NOMBRES_EMAIL[enviado as keyof typeof NOMBRES_EMAIL] ?? enviado}.</p>}

      <div className="mt-8 flex flex-col gap-8">
        {TIPOS_EMAIL.map((tipo) => {
          const correo = plantilla(tipo, muestra(tipo), { origen, baja });
          return (
            <section key={tipo} className="rounded-2xl border-2 border-filete bg-superficie p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">{NOMBRES_EMAIL[tipo]}</h2>
                  <p className="mt-1 text-sm text-pizarra">{correo.asunto}</p>
                </div>
                <form action={enviarCorreoPrueba}>
                  <input type="hidden" name="tipo" value={tipo} />
                  <button type="submit" className="min-h-11 rounded-xl bg-pino px-4 text-sm font-bold text-sobre-pino">
                    Enviarme una prueba
                  </button>
                </form>
              </div>
              <iframe title={correo.asunto} sandbox="" srcDoc={correo.html} className="mt-4 h-[640px] w-full rounded-2xl border-2 border-filete bg-white" />
            </section>
          );
        })}
      </div>
    </MarcoAdmin>
  );
}
