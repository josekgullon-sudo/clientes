import type { Metadata } from "next";
import Link from "next/link";
import { Award, Check, Crown, LogOut } from "lucide-react";
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
const objetivos = [
  { n: 5, t: "Suave" },
  { n: 10, t: "Constante" },
  { n: 20, t: "Intenso" },
  { n: 30, t: "A tope" },
];

export default async function Cuenta({ searchParams }: PageProps<"/app/cuenta">) {
  const q = await searchParams;
  const { user, suscrito, suscripcion } = await usuarioActual();
  const [estudio, logros] = await Promise.all([estadisticasUsuario(), logrosUsuario()]);
  const conseguidos = logros?.filter((l) => l.conseguido_en).length ?? 0;
  const inicial = (user.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-[2rem] leading-tight font-semibold">Tu cuenta</h1>

      <section aria-label="Tu plan" className="tarjeta p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-pino-suave font-serif text-2xl font-semibold text-pino" aria-hidden="true">
            {inicial}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold">{user.email}</p>
            <p className="mt-1">
              {suscrito ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-oro-suave px-2.5 py-0.5 text-sm font-bold text-oro-texto">
                  <Crown aria-hidden size={14} /> Premium{suscripcion?.plan ? ` · ${suscripcion.plan}` : ""}
                </span>
              ) : (
                <span className="rounded-full bg-papel-hundido px-2.5 py-0.5 text-sm font-bold text-pizarra">Plan gratis</span>
              )}
            </p>
          </div>
        </div>
        {suscripcion?.estado && estados[suscripcion.estado] && (
          <p className="mt-4 text-sm text-pizarra">
            Suscripción {estados[suscripcion.estado].toLowerCase()}
            {suscripcion.fin_periodo &&
              ` · ${suscrito ? "se renueva" : "terminó"} el ${fecha.format(new Date(suscripcion.fin_periodo))}`}
          </p>
        )}
        <div className="mt-4">
          {suscripcion?.stripe_customer_id ? (
            <form action="/api/stripe/portal" method="post">
              <Boton type="submit" variante="secundario" ancho tamano="md">
                Gestionar suscripción y facturas
              </Boton>
            </form>
          ) : suscrito ? null : (
            <EnlaceBoton href="/suscripcion" ancho tamano="md">
              <Crown aria-hidden size={16} /> Pasar a Premium
            </EnlaceBoton>
          )}
        </div>
      </section>

      {estudio && (
        <form action={guardarAjustes} className="tarjeta flex flex-col gap-5 p-5">
          <input type="hidden" name="volver" value="/app/cuenta" />
          <input type="hidden" name="confirmar" value="1" />
          <h2 className="text-lg font-bold">Cómo estudias</h2>
          {q.error === "ajustes" && (
            <p role="alert" className="rounded-xl border border-teja bg-teja-suave p-3">
              No hemos podido guardar los cambios. Vuelve a intentarlo.
            </p>
          )}
          {q.guardado === "1" && (
            <p role="status" className="flex items-center gap-2 rounded-xl bg-pino-suave p-3 font-semibold text-pino">
              <Check aria-hidden size={18} /> Cambios guardados.
            </p>
          )}
          <fieldset>
            <legend className="font-semibold">Preguntas al día</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {objetivos.map((o) => (
                <label
                  key={o.n}
                  className="flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-filete bg-papel transition has-checked:border-pino has-checked:bg-pino-suave has-focus-visible:outline-3 has-focus-visible:outline-tinta"
                >
                  <input type="radio" name="objetivo" value={o.n} defaultChecked={estudio.objetivo_diario === o.n} className="sr-only" />
                  <span className="cifras text-lg font-extrabold">{o.n}</span>
                  <span className="text-xs text-pizarra">{o.t}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-2">
            <label className="font-semibold" htmlFor="fecha">
              Fecha del examen
            </label>
            <input
              id="fecha"
              name="fecha"
              type="date"
              defaultValue={estudio.fecha_examen ?? ""}
              className="min-h-14 rounded-xl border border-filete bg-papel px-4"
            />
            <p className="text-sm text-pizarra">Si la dejas vacía, usamos la fecha estimada.</p>
          </div>
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block font-semibold">Recordatorio por correo</span>
              <span className="text-sm text-pizarra">Si un día no estudias, te escribimos una vez.</span>
            </span>
            <input type="checkbox" name="recordatorio" value="1" defaultChecked={estudio.recordatorio_email} className="peer sr-only" />
            <span
              aria-hidden="true"
              className="relative h-7 w-12 shrink-0 rounded-full bg-filete transition peer-checked:bg-pino-boton peer-focus-visible:outline-3 peer-focus-visible:outline-tinta after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-superficie after:shadow after:transition peer-checked:after:translate-x-5"
            />
          </label>
          <Boton type="submit">Guardar cambios</Boton>
        </form>
      )}

      {logros && logros.length > 0 && (
        <section aria-labelledby="logros">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="logros" className="text-lg font-bold">
              Logros
            </h2>
            <p className="cifras text-sm font-semibold text-pizarra">
              {conseguidos} de {logros.length}
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[...logros].sort((a, b) => Number(!!b.conseguido_en) - Number(!!a.conseguido_en)).map((l) => {
              const si = !!l.conseguido_en;
              return (
                <li
                  key={l.catalogo_id}
                  className={`flex flex-col items-center rounded-2xl border p-3 text-center ${si ? "border-subrayador/60 bg-oro-suave" : "border-filete bg-superficie"}`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-full ${si ? "bg-subrayador text-subrayador-texto" : "bg-papel-hundido text-pizarra/60"}`}
                    aria-hidden="true"
                  >
                    <Award size={20} />
                  </span>
                  <p className={`mt-2 text-sm leading-tight font-bold ${si ? "" : "text-pizarra"}`}>{l.nombre}</p>
                  <p className="mt-1 text-xs leading-snug text-pizarra">{l.descripcion}</p>
                  {si && <p className="mt-1.5 text-xs font-semibold text-oro-texto">{fecha.format(new Date(l.conseguido_en!))}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col items-center gap-4 border-t border-filete pt-6">
        <form action="/auth/salir" method="post">
          <Boton type="submit" variante="secundario" tamano="md">
            <LogOut aria-hidden size={16} /> Cerrar sesión
          </Boton>
        </form>
        <nav aria-label="Información legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-pizarra">
          {[
            ["/legal/aviso-legal", "Aviso legal"],
            ["/legal/privacidad", "Privacidad"],
            ["/legal/cookies", "Cookies"],
            ["/legal/condiciones", "Condiciones"],
          ].map(([h, t]) => (
            <Link key={h} href={h} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
              {t}
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
