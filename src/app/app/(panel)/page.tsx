import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Crown, Flame, Gift, Lock, RotateCcw, SlidersHorizontal, Timer, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Boton, EnlaceBoton } from "@/components/boton";
import { CaminoJuego } from "@/components/estudio/camino-juego";
import { Evento } from "@/components/evento";
import { ClaraDice } from "@/components/mascota/bocadillo";
import { Clara } from "@/components/mascota/clara";
import { caminoTemas, estadisticasUsuario } from "@/lib/datos/estudio";
import { siguienteBloqueado, siguienteLeccion } from "@/lib/estudio/camino";
import { diasEntre, hoyMadrid } from "@/lib/seo/seleccion";
import { examenEstimado } from "@/lib/examen";
import { CUOTA_GRATIS } from "@/lib/sitio";
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
      <Gift
        aria-label={cumplida ? "Misión cumplida" : "Misión pendiente"}
        size={28}
        className={cumplida ? "text-subrayador" : "text-filete"}
        fill={cumplida ? "currentColor" : "none"}
        strokeWidth={2}
      />
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
  const { suscrito, user } = await usuarioActual();
  const [progreso, racha, intentos, falladas, cuota, estudio, camino] = await Promise.all([
    progresoPorTema(),
    rachaActual(),
    ultimosIntentos(3),
    falladasPendientes(),
    cuotaRestante(),
    estadisticasUsuario(),
    caminoTemas(),
  ]);
  const rachaVisible = estudio?.racha_actual ?? racha;
  const objetivo = estudio?.objetivo_diario ?? 10;
  const hechasHoy = estudio?.preguntas_hoy ?? 0;
  const aciertosHoy = estudio?.aciertos_hoy ?? 0;
  const fechaExamen = estudio?.fecha_examen ?? examenEstimado()?.fecha ?? null;
  const diasExamen = fechaExamen ? diasEntre(hoyMadrid(), fechaExamen) : null;
  const leccion = camino ? siguienteLeccion(camino, suscrito) : null;
  const bloqueada = camino ? siguienteBloqueado(camino, suscrito) : null;
  const puedeLeccion = suscrito || !cuota || cuota.tema > 0;
  const temaRespaldo = !camino ? progreso.find((t) => t.total > 0) : null;
  const sinRepaso = falladas === 0 || (!suscrito && !!cuota && cuota.repaso === 0);
  const nombre = (user.user_metadata?.name as string | undefined)?.split(" ")[0];
  const faltan = Math.max(0, objetivo - hechasHoy);
  const metaAciertos = Math.ceil(objetivo * 0.7);

  const mensaje = !puedeLeccion
    ? `Has hecho tus ${CUOTA_GRATIS} preguntas gratis de hoy. ¡Mañana seguimos!`
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

      <ClaraDice pose={!puedeLeccion ? "duerme" : faltan === 0 ? "celebra" : "hola"}>
        <span className="block font-display text-lg font-black">
          {saludo()}
          {nombre ? `, ${nombre}` : ""}!
        </span>
        <span className="font-semibold">{mensaje}</span>
      </ClaraDice>

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
          {!puedeLeccion && !suscrito && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-[#a78bfa] bg-morado-suave p-4">
              <Crown aria-hidden className="shrink-0 text-morado-texto" />
              <p className="flex-1 text-sm font-bold">¿Quieres seguir hoy? Con Premium no hay límite.</p>
              <EnlaceBoton href="/suscripcion?motivo=cuota" variante="premium" tamano="md">
                Ver
              </EnlaceBoton>
            </div>
          )}
          {bloqueada && !leccion && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-[#a78bfa] bg-morado-suave p-4">
              <Crown aria-hidden className="shrink-0 text-morado-texto" />
              <p className="flex-1 text-sm font-bold">Has completado los niveles gratis. Del 3 al 5 son de Premium.</p>
              <EnlaceBoton href="/suscripcion?motivo=nivel" variante="premium" tamano="md">
                Ver
              </EnlaceBoton>
            </div>
          )}
          <CaminoJuego temas={camino} premium={suscrito} puedeLeccion={puedeLeccion} soloAlrededor />
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
    </div>
  );
}
