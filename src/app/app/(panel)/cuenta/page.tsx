import type { Metadata } from "next";
import { Boton, EnlaceBoton } from "@/components/boton";
import { estadisticasUsuario, logrosUsuario } from "@/lib/datos/estudio";
import { usuarioActual } from "@/lib/datos/usuario";
import { guardarAjustes } from "../../ajustes";

export const metadata: Metadata = { title: "Tu cuenta" };

const fecha = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" });
const estados: Record<string, string> = {
  active: "Activa",
  trialing: "En periodo de prueba",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  unpaid: "Sin pagar",
};

export default async function Cuenta({ searchParams }: PageProps<"/app/cuenta">) {
  const q = await searchParams;
  const { user, suscrito, suscripcion } = await usuarioActual();
  const [estudio, logros] = await Promise.all([estadisticasUsuario(), logrosUsuario()]);
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

      {estudio && (
        <form action={guardarAjustes} className="mt-8 flex flex-col gap-4">
          <input type="hidden" name="volver" value="/app/cuenta" />
          <h2 className="font-serif text-xl font-semibold">Cómo estudias</h2>
          {q.error === "ajustes" && (
            <p role="alert" className="rounded-md border border-teja bg-teja-suave p-3">No hemos podido guardar los cambios.</p>
          )}
          <fieldset>
            <legend className="font-semibold">Objetivo diario</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[5, 10, 20, 30].map((n) => (
                <label key={n} className="flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-filete has-checked:border-tinta has-checked:bg-tinta has-checked:text-papel">
                  <input type="radio" name="objetivo" value={n} defaultChecked={estudio.objetivo_diario === n} className="sr-only" />
                  {n}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="font-semibold" htmlFor="fecha">Fecha del examen</label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={estudio.fecha_examen ?? ""}
            className="min-h-14 rounded-md border border-pizarra/70 bg-papel px-4"
          />
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="recordatorio" value="1" defaultChecked={estudio.recordatorio_email} className="size-5" />
            Recordatorio por correo si un día no estudias
          </label>
          <Boton type="submit">Guardar</Boton>
        </form>
      )}

      {logros && (
        <section className="mt-10" aria-labelledby="logros">
          <h2 id="logros" className="font-serif text-xl font-semibold">Logros</h2>
          <ul className="mt-3 grid gap-2">
            {logros.map((l) => (
              <li key={l.catalogo_id} className={`rounded-xl border p-3 ${l.conseguido_en ? "border-pino bg-pino-suave" : "border-filete text-pizarra"}`}>
                <p className="font-semibold text-tinta">{l.nombre}</p>
                <p className="text-[0.95rem]">{l.descripcion}</p>
                {l.conseguido_en && (
                  <p className="mt-1 text-[0.9rem] text-pino">
                    Conseguido el {fecha.format(new Date(l.conseguido_en))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-col gap-2">
        {suscripcion?.stripe_customer_id ? (
          <form action="/api/stripe/portal" method="post">
            <Boton type="submit" variante="secundario" ancho>
              Gestionar suscripción y facturas
            </Boton>
          </form>
        ) : suscrito ? null : (
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
