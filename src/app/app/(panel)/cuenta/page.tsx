import type { Metadata } from "next";
import { Boton, EnlaceBoton } from "@/components/boton";
import { usuarioActual } from "@/lib/datos/usuario";

export const metadata: Metadata = { title: "Tu cuenta" };

const fecha = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" });
const estados: Record<string, string> = {
  active: "Activa",
  trialing: "En periodo de prueba",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  unpaid: "Sin pagar",
};

export default async function Cuenta() {
  const { user, suscrito, suscripcion } = await usuarioActual();
  return (
    <div className="max-w-lectura">
      <h1 className="font-serif text-[2rem] leading-tight font-semibold">Tu cuenta</h1>
      <dl className="mt-6 border-t border-filete">
        <div className="flex justify-between gap-4 border-b border-filete py-3">
          <dt className="font-semibold">Correo</dt>
          <dd className="truncate">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-filete py-3">
          <dt className="font-semibold">Suscripción</dt>
          <dd className="text-right">
            {suscripcion?.estado && estados[suscripcion.estado]
              ? `${estados[suscripcion.estado]}${suscripcion.plan ? ` · plan ${suscripcion.plan}` : ""}`
              : "Sin suscripción"}
            {suscripcion?.fin_periodo && (
              <span className="block text-[0.9rem] text-pizarra">
                {suscrito ? "Se renueva" : "Terminó"} el {fecha.format(new Date(suscripcion.fin_periodo))}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-2">
        {suscripcion?.stripe_customer_id ? (
          <form action="/api/stripe/portal" method="post">
            <Boton type="submit" variante="secundario" ancho>
              Gestionar suscripción y facturas
            </Boton>
          </form>
        ) : (
          <EnlaceBoton href="/suscripcion" ancho>
            Ver planes
          </EnlaceBoton>
        )}
        <form action="/auth/salir" method="post">
          <Boton type="submit" variante="texto" ancho>
            Cerrar sesión
          </Boton>
        </form>
      </div>
    </div>
  );
}
