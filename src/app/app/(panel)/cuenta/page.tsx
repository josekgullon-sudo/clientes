import type { Metadata } from "next";
import Link from "next/link";
import { AlarmClock, Award, BookOpen, Check, Crosshair, Crown, Flag, Flame, Gift, LogOut, Trophy, Zap } from "lucide-react";
import { Boton, EnlaceBoton } from "@/components/boton";
import { Avatar } from "@/components/ui/avatar";
import { estadisticasUsuario, logrosUsuario, perfilPublico } from "@/lib/datos/estudio";
import { AVATARES } from "@/lib/estudio/perfil";
import { usuarioActual } from "@/lib/datos/usuario";
import { guardarAjustes, guardarPerfilPublico } from "../../ajustes";

export const metadata: Metadata = { title: "Tu perfil" };

const fecha = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" });
const estados: Record<string, string> = {
  active: "Activa",
  trialing: "En periodo de prueba",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  unpaid: "Sin pagar",
};
/** Icono y color de cada familia de logros. */
const ESTILOS_LOGRO: Record<string, { Icono: typeof Award; color: string; sombra: string }> = {
  meta: { Icono: Flag, color: "#16a34a", sombra: "#15803d" },
  corona: { Icono: Crown, color: "#eab308", sombra: "#a16207" },
  racha: { Icono: Flame, color: "#f97316", sombra: "#c2410c" },
  punteria: { Icono: Crosshair, color: "#0ea5e9", sombra: "#0369a1" },
  volumen: { Icono: BookOpen, color: "#8b5cf6", sombra: "#6d28d9" },
  reloj: { Icono: AlarmClock, color: "#ec4899", sombra: "#be185d" },
  cofre: { Icono: Gift, color: "#c2410c", sombra: "#9a3412" },
  liga: { Icono: Trophy, color: "#f59e0b", sombra: "#b45309" },
};

const objetivos = [
  { n: 5, t: "Suave" },
  { n: 10, t: "Constante" },
  { n: 20, t: "Intenso" },
  { n: 30, t: "A tope" },
];

export default async function Cuenta({ searchParams }: PageProps<"/app/cuenta">) {
  const q = await searchParams;
  const [{ user, suscrito, suscripcion }, estudio, logros, perfil] = await Promise.all([
    usuarioActual(),
    estadisticasUsuario(),
    logrosUsuario(),
    perfilPublico(),
  ]);
  const conseguidos = logros?.filter((l) => l.conseguido_en).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start xl:gap-10">
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <section aria-labelledby="titulo-perfil" className="flex flex-col items-center text-center">
            <Avatar clave={perfil?.avatar} className="size-24 text-5xl shadow-[0_4px_0_var(--filete)]" />
            <h1 id="titulo-perfil" className="mt-3 font-display text-[1.75rem] leading-tight font-black">
              {perfil?.alias ?? "Tu perfil"}
            </h1>
            <p className="max-w-full truncate text-sm font-semibold text-pizarra">{user.email}</p>
            {estudio && (
              <div className="mt-4 grid w-full grid-cols-3 gap-3">
                {[
                  { v: estudio.racha_actual, t: "Racha", Icono: Flame, c: "text-naranja-texto" },
                  { v: estudio.xp_total, t: "XP total", Icono: Zap, c: "text-oro-texto" },
                  { v: conseguidos, t: "Logros", Icono: Award, c: "text-morado-texto" },
                ].map(({ v, t, Icono, c }) => (
                  <div key={t} className="tarjeta flex flex-col items-center px-2 py-3">
                    <Icono aria-hidden size={22} className={c} />
                    <span className="cifras mt-1 font-display text-xl font-black">{v}</span>
                    <span className="text-xs font-bold text-pizarra">{t}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-label="Tu plan" className="tarjeta p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-black">Tu plan</h2>
              {suscrito ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-morado-suave px-2.5 py-0.5 text-sm font-black text-morado-texto">
                  <Crown aria-hidden size={14} /> Premium{suscripcion?.plan ? ` · ${suscripcion.plan}` : ""}
                </span>
              ) : (
                <span className="rounded-full bg-papel-hundido px-2.5 py-0.5 text-sm font-bold text-pizarra">Plan gratis</span>
              )}
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
                <EnlaceBoton href="/suscripcion" variante="premium" ancho tamano="md">
                  <Crown aria-hidden size={16} /> Pasar a Premium
                </EnlaceBoton>
              )}
            </div>
          </section>

        </div>
        <div className="flex min-w-0 flex-col gap-6">
          {perfil && (
            <form id="perfil" action={guardarPerfilPublico} className="tarjeta flex scroll-mt-24 flex-col gap-5 p-5">
              <h2 className="font-display text-lg font-black">Tu perfil en la liga</h2>
              {q.error === "perfil" && (
                <p role="alert" className="rounded-xl border-2 border-teja bg-teja-suave p-3 font-semibold">
                  Revisa el alias: de 3 a 20 letras o números, sin símbolos raros.
                </p>
              )}
              {q.guardado === "perfil" && (
                <p role="status" className="flex items-center gap-2 rounded-xl bg-pino-suave p-3 font-bold text-pino">
                  <Check aria-hidden size={18} /> ¡Perfil guardado!
                </p>
              )}
              <div className="flex flex-col gap-2">
                <label htmlFor="alias" className="font-bold">
                  Alias
                </label>
                <input
                  id="alias"
                  name="alias"
                  defaultValue={perfil.personalizado ? perfil.alias : ""}
                  placeholder={perfil.alias}
                  minLength={3}
                  maxLength={20}
                  autoComplete="nickname"
                  className="min-h-14 rounded-2xl border-2 border-filete bg-papel px-4 font-semibold"
                />
                <p className="text-sm text-pizarra">Es lo único que ven los demás. Si lo dejas vacío, usamos «{perfil.alias}».</p>
              </div>
              <fieldset>
                <legend className="font-bold">Avatar</legend>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {Object.entries(AVATARES).map(([clave, a]) => (
                    <label
                      key={clave}
                      className="grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-filete text-2xl transition has-checked:border-cielo has-checked:shadow-[0_3px_0_var(--cielo)] has-focus-visible:outline-3 has-focus-visible:outline-tinta"
                      style={{ background: a.fondo }}
                    >
                      <input type="radio" name="avatar" value={clave} defaultChecked={perfil.avatar === clave} className="sr-only" />
                      <span aria-hidden="true">{a.emoji}</span>
                      <span className="sr-only">{a.nombre}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4">
                <span>
                  <span className="block font-bold">Aparecer en la liga</span>
                  <span className="text-sm text-pizarra">Compite cada semana por XP con otros opositores.</span>
                </span>
                <input type="checkbox" name="en_liga" value="1" defaultChecked={perfil.en_liga} className="peer sr-only" />
                <span
                  aria-hidden="true"
                  className="relative h-7 w-12 shrink-0 rounded-full bg-filete transition peer-checked:bg-pino-boton peer-focus-visible:outline-3 peer-focus-visible:outline-tinta after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-superficie after:shadow after:transition peer-checked:after:translate-x-5"
                />
              </label>
              <Boton type="submit">Guardar perfil</Boton>
            </form>
          )}

          {estudio && (
            <form action={guardarAjustes} className="tarjeta flex flex-col gap-5 p-5">
              <input type="hidden" name="volver" value="/app/cuenta" />
              <input type="hidden" name="confirmar" value="1" />
              <h2 className="font-display text-lg font-black">Cómo estudias</h2>
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
                <h2 id="logros" className="font-display text-xl font-black">
                  Logros
                </h2>
                <p className="cifras text-sm font-semibold text-pizarra">
                  {conseguidos} de {logros.length}
                </p>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {[...logros].sort((a, b) => Number(!!b.conseguido_en) - Number(!!a.conseguido_en)).map((l) => {
                  const si = !!l.conseguido_en;
                  const estilo = ESTILOS_LOGRO[l.icono] ?? ESTILOS_LOGRO.meta;
                  return (
                    <li
                      key={l.catalogo_id}
                      className={`flex flex-col items-center rounded-2xl border-2 p-3 text-center ${si ? "border-filete bg-superficie shadow-[0_3px_0_var(--filete)]" : "border-dashed border-filete"}`}
                    >
                      <span
                        className="grid size-14 place-items-center rounded-full"
                        style={si ? { background: estilo.color, boxShadow: `0 4px 0 ${estilo.sombra}`, color: "#fff" } : { background: "var(--papel-hundido)", color: "var(--pizarra)" }}
                        aria-hidden="true"
                      >
                        <estilo.Icono size={26} strokeWidth={2.4} />
                      </span>
                      <p className={`mt-3 text-sm leading-tight font-black ${si ? "" : "text-pizarra"}`}>{l.nombre}</p>
                      <p className="mt-1 text-xs leading-snug text-pizarra">{l.descripcion}</p>
                      {si && <p className="mt-1.5 text-xs font-bold text-pino">✓ {fecha.format(new Date(l.conseguido_en!))}</p>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

        </div>
      </div>
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
