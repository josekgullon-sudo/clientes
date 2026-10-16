import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronRight, Crown, Flame, Lightbulb, Lock, RotateCcw, SlidersHorizontal, Timer, Trophy, Zap, Landmark } from "lucide-react";
import type { ReactNode } from "react";
import { Boton, EnlaceBoton } from "@/components/boton";
import { CaminoJuego } from "@/components/estudio/camino-juego";
import { CofreDiario } from "@/components/estudio/cofre";
import { TarjetaTestHoy } from "@/components/estudio/tarjeta-hoy";
import { Avatar } from "@/components/ui/avatar";
import { InstalarApp } from "@/components/app/instalar-app";
import { Evento } from "@/components/evento";
import { ClaraDice } from "@/components/mascota/bocadillo";
import { Clara } from "@/components/mascota/clara";
import { caminoTemas, cofreHoy, estadisticasUsuario, ligaSemanal } from "@/lib/datos/estudio";
import { siguienteBloqueado, siguienteLeccion } from "@/lib/estudio/camino";
import { diasEntre, hoyMadrid } from "@/lib/seo/seleccion";
import { examenEstimado } from "@/lib/examen";
import { curiosidadDelDia } from "@/lib/estudio/curiosidades";
import { CUOTA_GRATIS, datosOposicion } from "@/lib/sitio";
import { estadoTestHoy } from "@/lib/datos/retencion";
import {
  cuotaRestante,
  falladasPendientes,
  progresoPorTema,
  rachaActual,
  ultimosIntentos,
  usuarioActual,
} from "@/lib/datos/usuario";
import { crearTest } from "../acciones";

export const metadata: Metadata = { title: "Hoy" };

const nombresModo: Record<string, string> = {
  tema: "Test por tema",
  mixto: "Test a medida",
  falladas: "Repaso de fallos",
  simulacro: "Simulacro",
  leccion: "Lección",
  repaso: "Repaso",
  salto: "Test de salto",
  nivel: "Test de nivel",
  hoy: "Test de hoy",
};
const fechaCorta = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });

function saludo() {
  const hora = Number(new Intl.DateTimeFormat("es-ES", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Madrid" }).format(new Date()));
  if (hora < 6) return "¡Buenas noches";
  if (hora < 14) return "¡Buenos días";
  if (hora < 21) return "¡Buenas tardes";
  return "¡Buenas noches";
}

/** Barra de misión diaria, con cofre al final. */
function Mision({
  icono,
  titulo,
  hecho,
  meta,
  color,
}: {
  icono: ReactNode;
  titulo: string;
  hecho: number;
  meta: number;
  color: string;
}) {
  const ratio = meta > 0 ? Math.min(1, hecho / meta) : 0;
  const cumplida = ratio >= 1;
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
        {icono}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">{titulo}</p>
        <div className="relative mt-1.5 h-4 overflow-hidden rounded-full bg-papel-hundido">
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${ratio * 100}%`, background: color }} />
          <span className="cifras absolute inset-0 grid place-items-center text-[0.6875rem] font-black text-tinta/80">
            {Math.min(hecho, meta)} / {meta}
          </span>
        </div>
      </div>
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-full ${cumplida ? "bg-pino-vivo text-white" : "border-2 border-dashed border-filete"}`}
      >
        {cumplida ? <Check aria-label="Misión cumplida" size={18} strokeWidth={3.5} /> : <span className="sr-only">Misión pendiente</span>}
      </span>
    </li>
  );
}

/** Acceso a un modo de práctica, como una ficha de color. */
function Modo({
  icono,
  titulo,
  texto,
  color,
  sombra,
  insignia,
  bloqueado,
}: {
  icono: ReactNode;
  titulo: string;
  texto: string;
  color: string;
  sombra: string;
  insignia?: string;
  bloqueado?: boolean;
}) {
  return (
    <span
      className="flex h-full items-center gap-3 rounded-2xl p-4 text-left text-white transition group-active:translate-y-[3px] group-disabled:opacity-50"
      style={{ background: color, boxShadow: `0 4px 0 ${sombra}` }}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/20">{icono}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-display text-lg leading-tight font-black">
          {titulo}
          {insignia && (
            <span className="cifras rounded-full bg-white px-2 py-0.5 text-xs font-black" style={{ color }}>
              {insignia}
            </span>
          )}
          {bloqueado && <Lock aria-label="Premium" size={15} />}
        </span>
        <span className="mt-0.5 block text-sm font-semibold opacity-90">{texto}</span>
      </span>
      <ChevronRight aria-hidden size={20} className="shrink-0 opacity-80" />
    </span>
  );
}

export default async function Panel({ searchParams }: PageProps<"/app">) {
  const q = await searchParams;
  const [{ suscrito, user }, progreso, racha, intentos, falladas, cuota, estudio, camino, cofre, liga, hoy] = await Promise.all([
    usuarioActual(),
    progresoPorTema(),
    rachaActual(),
    ultimosIntentos(3),
    falladasPendientes(),
    cuotaRestante(),
    estadisticasUsuario(),
    caminoTemas(),
    cofreHoy(),
    ligaSemanal(),
    estadoTestHoy(),
  ]);
  const rachaVisible = estudio?.racha_actual ?? racha;
  const objetivo = estudio?.objetivo_diario ?? 10;
  const hechasHoy = estudio?.preguntas_hoy ?? 0;
  const aciertosHoy = estudio?.aciertos_hoy ?? 0;
  const fechaExamen = estudio?.fecha_examen ?? examenEstimado(estudio?.oposicion)?.fecha ?? null;
  const diasExamen = fechaExamen ? diasEntre(hoyMadrid(), fechaExamen) : null;
  const leccion = camino ? siguienteLeccion(camino, suscrito) : null;
  const bloqueada = camino ? siguienteBloqueado(camino, suscrito) : null;
  const puedeLeccion = suscrito || !cuota || cuota.tema > 0;
  const temaRespaldo = !camino ? progreso.find((t) => t.total > 0) : null;
  const sinRepaso = falladas === 0 || (!suscrito && !!cuota && cuota.repaso === 0);
  const nombre = (user.user_metadata?.name as string | undefined)?.split(" ")[0];
  const faltan = Math.max(0, objetivo - hechasHoy);
  const metaAciertos = Math.ceil(objetivo * 0.7);
  const curiosidad = curiosidadDelDia(hoyMadrid());
  const opo = datosOposicion(estudio?.oposicion);

  const mensaje = !puedeLeccion
    ? `Ya has hecho tus ${CUOTA_GRATIS} preguntas gratis de hoy. Hazte Premium y sigue sin límite.`
    : faltan === 0
      ? "¡Objetivo cumplido! Tu racha está a salvo. Si quieres, sigue un poco más."
      : hechasHoy === 0
        ? rachaVisible > 0
          ? `Llevas ${rachaVisible} ${rachaVisible === 1 ? "día" : "días"} de racha. Haz ${objetivo} preguntas para no perderla.`
          : `Haz ${objetivo} preguntas hoy y empieza tu racha.`
        : `¡Vas bien! Te ${faltan === 1 ? "falta 1 pregunta" : `faltan ${faltan} preguntas`} para el objetivo.`;

  return (
    <div className="flex flex-col gap-8">
      {q.suscripcion === "ok" && <Evento nombre="purchase" />}
      {q.suscripcion === "ok" && (
        <section className="relative overflow-hidden rounded-[1.25rem] border-2 border-[#a78bfa] bg-morado-suave p-5" role="status">
          <div className="confeti" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ left: `${4 + i * 7}%`, animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Clara pose="premium" className="size-24 shrink-0" />
            <div>
              <p className="font-display text-2xl font-black text-morado-texto">¡Ya eres Premium!</p>
              <p className="mt-1 font-semibold">Sin límite diario y con todos los niveles. ¿Un simulacro?</p>
            </div>
          </div>
          <div className="mt-4">
            <EnlaceBoton href="/app/simulacro" variante="premium" ancho>
              Hacer un simulacro
            </EnlaceBoton>
          </div>
        </section>
      )}

      <ClaraDice pose={!puedeLeccion ? "duerme" : faltan === 0 ? "celebra" : "hola"} saludoInfinito>
        <span className="block font-display text-lg font-black">
          {saludo()}
          {nombre ? `, ${nombre}` : ""}!
        </span>
        <span className="font-semibold">{mensaje}</span>
      </ClaraDice>

      {!puedeLeccion && !suscrito && (
        <section
          aria-label="Límite diario"
          className="flex flex-col gap-4 rounded-[1.25rem] border-2 border-[#a78bfa] bg-morado-suave p-5 sm:flex-row sm:items-center"
        >
          <Crown aria-hidden className="shrink-0 text-morado-texto" size={32} />
          <div className="flex-1">
            <p className="font-display text-xl font-black text-morado-texto">Ya has hecho el test de hoy</p>
            <p className="mt-1 font-semibold">
              Has usado tus {CUOTA_GRATIS} preguntas gratis. Hazte Premium para seguir ahora, o vuelve mañana.
            </p>
          </div>
          <EnlaceBoton href="/suscripcion?motivo=cuota" variante="premium" className="shrink-0 max-sm:w-full">
            Seguir con Premium
          </EnlaceBoton>
        </section>
      )}

      <Link
        href="/app/cuenta#oposicion"
        className="-mt-4 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-pino-suave px-4 text-sm font-extrabold text-pino hover:brightness-95"
      >
        <Landmark aria-hidden size={16} />
        {opo.nombre}
        <span className="font-semibold text-pizarra">· {q.oposicion ? "¡Lista!" : "Cambiar"}</span>
      </Link>

      {hoy && (hoy.hecho || hoy.abierto || suscrito || !cuota || cuota.tema > 0) && (
        <TarjetaTestHoy
          hecho={hoy.hecho}
          racha={rachaVisible}
          accion={
            hoy.hecho ? null : hoy.abierto ? (
              <EnlaceBoton href={`/app/test/${hoy.abierto}`} ancho>
                Seguir
              </EnlaceBoton>
            ) : !suscrito && cuota && cuota.tema === 0 ? (
              <EnlaceBoton href="/suscripcion?motivo=cuota" variante="premium" ancho>
                Seguir con Premium
              </EnlaceBoton>
            ) : (
              <form action={crearTest}>
                <input type="hidden" name="modo" value="hoy" />
                <input type="hidden" name="num" value="10" />
                <Boton type="submit" ancho>
                  Hacerlo ahora
                </Boton>
              </form>
            )
          }
        />
      )}

      <InstalarApp />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-10">
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="misiones">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="misiones" className="font-display text-xl font-black">
                Misiones de hoy
              </h2>
              {diasExamen !== null && (
                <p className="cifras text-sm font-extrabold text-pizarra">{Math.max(0, diasExamen)} días al examen</p>
              )}
            </div>
            <ul className="tarjeta divide-y-2 divide-filete">
              <Mision
                icono={<Zap aria-hidden size={22} />}
                titulo={`Responde ${objetivo} preguntas`}
                hecho={hechasHoy}
                meta={objetivo}
                color="#eab308"
              />
              <Mision
                icono={<Flame aria-hidden size={22} />}
                titulo={`Acierta ${metaAciertos} preguntas`}
                hecho={aciertosHoy}
                meta={metaAciertos}
                color="#f97316"
              />
              <CofreDiario listo={hechasHoy >= objetivo && aciertosHoy >= metaAciertos} xpAbierto={cofre} />
            </ul>
          </section>

          {camino ? (
            <section aria-labelledby="tu-camino">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 id="tu-camino" className="font-display text-xl font-black">
                  Tu camino
                </h2>
                <Link href="/app/camino" className="enlace text-sm">
                  Ver todo
                </Link>
              </div>
              {bloqueada && !leccion && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-[#a78bfa] bg-morado-suave p-4">
                  <Crown aria-hidden className="shrink-0 text-morado-texto" />
                  <p className="flex-1 text-sm font-bold">Has completado los niveles gratis. Del 3 al 5 son de Premium.</p>
                  <EnlaceBoton href="/suscripcion?motivo=nivel" variante="premium" tamano="md">
                    Ver
                  </EnlaceBoton>
                </div>
              )}
              <CaminoJuego temas={camino} premium={suscrito} puedeLeccion={puedeLeccion} soloAlrededor oposicion={estudio?.oposicion} />
            </section>
          ) : temaRespaldo && puedeLeccion ? (
            <section className="tarjeta p-5">
              <p className="antetitulo">Sigue por aquí</p>
              <h2 className="mt-1 font-display text-xl font-black">
                Tema {temaRespaldo.numero}. {temaRespaldo.titulo}
              </h2>
              <form action={crearTest} className="mt-4">
                <input type="hidden" name="modo" value="tema" />
                <input type="hidden" name="tema" value={temaRespaldo.tema_id} />
                <input type="hidden" name="num" value="10" />
                <Boton ancho>Hacer 10 preguntas</Boton>
              </form>
            </section>
          ) : null}

          <section aria-labelledby="practicar">
            <h2 id="practicar" className="mb-3 font-display text-xl font-black">
              Más formas de practicar
            </h2>
            <Link href="/reto" className="group mb-4 block rounded-2xl">
              <Modo
                icono={<Zap aria-hidden size={22} className="fill-current" />}
                titulo="Reto relámpago"
                texto="60 segundos, todas las que puedas."
                color="#854d0e"
                sombra="#5b3409"
                insignia="Nuevo"
              />
            </Link>
            <div className="grid gap-4 sm:grid-cols-3">
              <form action={crearTest}>
                <input type="hidden" name="modo" value="repaso" />
                <input type="hidden" name="num" value="10" />
                <button type="submit" disabled={sinRepaso} className="group block h-full w-full rounded-2xl disabled:cursor-not-allowed">
                  <Modo
                    icono={<RotateCcw aria-hidden size={22} />}
                    titulo="Repaso"
                    texto={falladas ? "Tus fallos, hasta que los aciertes." : "Aquí irán tus fallos."}
                    color="#c2410c"
                    sombra="#9a3412"
                    insignia={falladas ? String(falladas) : undefined}
                  />
                </button>
              </form>
              <Link href="/app/simulacro" className="group block rounded-2xl">
                <Modo icono={<Timer aria-hidden size={22} />} titulo="Simulacro" texto="Con tiempo, como el examen." color="#0369a1" sombra="#075985" />
              </Link>
              <Link href={suscrito ? "/app/nuevo" : "/suscripcion?motivo=personalizado"} className="group block rounded-2xl">
                <Modo
                  icono={<SlidersHorizontal aria-hidden size={22} />}
                  titulo="A medida"
                  texto="Tú eliges temas y preguntas."
                  color="#7c3aed"
                  sombra="#5b21b6"
                  bloqueado={!suscrito}
                />
              </Link>
            </div>
          </section>

        </div>

        <aside aria-label="Tu semana" className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24">
          {liga && (
            <Link href="/app/liga" className="tarjeta flex items-center gap-4 p-4 transition hover:bg-papel-hundido/60">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-naranja-suave text-naranja-texto" aria-hidden="true">
                <Trophy size={30} strokeWidth={2.4} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg leading-tight font-black">Liga de la semana</span>
                <span className="text-sm font-semibold text-pizarra">
                  {liga.mi_posicion && (liga.filas.find((f) => f.yo)?.xp ?? 0) > 0
                    ? `Vas ${liga.mi_posicion}.º de ${liga.participantes}. ¡A por más XP!`
                    : "Gana XP esta semana para entrar en la clasificación."}
                </span>
              </span>
              <span className="hidden -space-x-3 sm:flex" aria-hidden="true">
                {liga.filas.slice(0, 3).map((f) => (
                  <Avatar key={f.pos} clave={f.avatar} className="size-9 text-lg ring-2 ring-superficie" />
                ))}
              </span>
              <ChevronRight aria-hidden size={20} className="shrink-0 text-pizarra" />
            </Link>
          )}

          {!suscrito && cuota && puedeLeccion && (
            <section aria-label="Tu plan" className="flex items-center gap-4 rounded-[1.25rem] border-2 border-[#a78bfa] bg-morado-suave p-4">
              <Clara pose="premium" animada={false} className="size-16 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-display font-black text-morado-texto">Plan gratis</p>
                <p className="cifras text-sm font-semibold">
                  Te quedan {cuota.tema} de {CUOTA_GRATIS} preguntas hoy
                </p>
              </div>
              <EnlaceBoton href="/suscripcion" variante="premium" tamano="md" className="shrink-0">
                Premium
              </EnlaceBoton>
            </section>
          )}

          <section aria-labelledby="sabias" className="tarjeta tarjeta-viva relative overflow-hidden p-5">
            <div className="flex items-start gap-4">
              <Clara pose="piensa" className="-mb-2 size-20 shrink-0" />
              <div className="min-w-0">
                <h2 id="sabias" className="flex items-center gap-1.5 font-display text-lg font-black text-oro-texto">
                  <Lightbulb aria-hidden size={20} className="fill-subrayador text-oro-texto" /> ¿Sabías que…?
                </h2>
                <p className="mt-1 font-semibold leading-snug">{curiosidad.texto}</p>
                <p className="mt-2 inline-block rounded-full bg-oro-suave px-2.5 py-0.5 text-xs font-black text-oro-texto">{curiosidad.fuente}</p>
              </div>
            </div>
          </section>

          {intentos.length > 0 && (
            <section aria-labelledby="ultimos">
              <h2 id="ultimos" className="mb-3 font-display text-xl font-black">
                Tus últimos test
              </h2>
              <ul className="tarjeta divide-y-2 divide-filete">
                {intentos.map((i) => {
                  const total = i.preguntas.length;
                  const ratio = total ? (i.aciertos ?? 0) / total : 0;
                  return (
                    <li key={i.id}>
                      <Link href={`/app/test/${i.id}`} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-papel-hundido/60">
                        <span className="min-w-0 flex-1">
                          <span className="block font-extrabold">{nombresModo[i.modo] ?? "Test"}</span>
                          <span className="text-sm text-pizarra">{fechaCorta.format(new Date(i.creado_en))}</span>
                        </span>
                        <span
                          className={`cifras rounded-full px-2.5 py-1 text-sm font-black ${ratio >= 0.6 ? "bg-pino-suave text-pino" : "bg-teja-suave text-teja"}`}
                        >
                          {i.aciertos}/{total}
                        </span>
                        <ChevronRight aria-hidden size={18} className="text-pizarra" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
