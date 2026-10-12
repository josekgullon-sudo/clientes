import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Crown, Lock, RotateCcw, SlidersHorizontal, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { Boton, EnlaceBoton } from "@/components/boton";
import { AccionesLeccion, Niveles } from "@/components/estudio/camino";
import { Tablero } from "@/components/estudio/tablero";
import { Evento } from "@/components/evento";
import { caminoTemas, estadisticasUsuario } from "@/lib/datos/estudio";
import {
  minutosDeLeccion,
  nivelVisible,
  preguntasDeLeccion,
  siguienteBloqueado,
  siguienteLeccion,
} from "@/lib/estudio/camino";
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
const fechaLarga = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });

function saludo() {
  const hora = Number(new Intl.DateTimeFormat("es-ES", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Madrid" }).format(new Date()));
  if (hora < 6) return "Buenas noches";
  if (hora < 14) return "Buenos días";
  if (hora < 21) return "Buenas tardes";
  return "Buenas noches";
}

/** Acceso a un modo de práctica: icono, título y una línea. */
function Acceso({
  icono,
  titulo,
  texto,
  insignia,
  bloqueado,
}: {
  icono: ReactNode;
  titulo: string;
  texto: string;
  insignia?: string;
  bloqueado?: boolean;
}) {
  return (
    <span className="tarjeta flex h-full items-center gap-3 p-4 text-left transition group-hover:border-pino/50 group-disabled:opacity-50 sm:flex-col sm:items-start">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-pino-suave text-pino">{icono}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-bold">
          {titulo}
          {insignia && <span className="cifras rounded-full bg-teja-suave px-2 py-0.5 text-xs font-bold text-teja">{insignia}</span>}
          {bloqueado && <Lock aria-label="Premium" size={14} className="text-pizarra" />}
        </span>
        <span className="mt-0.5 block text-sm text-pizarra">{texto}</span>
      </span>
      <ChevronRight aria-hidden size={18} className="shrink-0 text-pizarra sm:hidden" />
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
  const fechaExamen = estudio?.fecha_examen ?? examenEstimado()?.fecha ?? null;
  const diasExamen = fechaExamen ? diasEntre(hoyMadrid(), fechaExamen) : null;
  const leccion = camino ? siguienteLeccion(camino, suscrito) : null;
  const bloqueada = camino ? siguienteBloqueado(camino, suscrito) : null;
  const puedeLeccion = suscrito || !cuota || cuota.tema > 0;
  const temaRespaldo = !camino ? progreso.find((t) => t.total > 0) : null;
  const sinRepaso = falladas === 0 || (!suscrito && !!cuota && cuota.repaso === 0);
  const nombre = (user.user_metadata?.name as string | undefined)?.split(" ")[0];

  const flojos = progreso
    .filter((t) => t.vistas >= 5 && t.dominadas / t.vistas < 0.6)
    .sort((a, b) => a.dominadas / a.vistas - b.dominadas / b.vistas)
    .slice(0, 3);

  // Próximos temas del camino, a partir de la lección actual.
  const orden = camino ? [...camino].filter((t) => t.total > 0).sort((a, b) => a.numero - b.numero) : [];
  const desde = leccion ? orden.findIndex((t) => t.tema_id === leccion.tema_id) : 0;
  const proximos = orden.slice(desde + 1, desde + 4);

  return (
    <div className="flex flex-col gap-8">
      {q.suscripcion === "ok" && <Evento nombre="purchase" />}
      {q.suscripcion === "ok" && (
        <section className="tarjeta relative overflow-hidden border-pino bg-pino-suave p-5" role="status">
          <div className="confeti" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ left: `${4 + i * 7}%`, animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
          <p className="flex items-center gap-2 font-serif text-2xl font-semibold">
            <Crown aria-hidden className="text-oro-texto" /> Ya eres Premium
          </p>
          <p className="mt-1">Sin límite diario y con todos los niveles. Un buen siguiente paso es un simulacro.</p>
          <div className="mt-4">
            <EnlaceBoton href="/app/simulacro" tamano="md">
              Hacer un simulacro
            </EnlaceBoton>
          </div>
        </section>
      )}

      <header>
        <p className="text-sm font-semibold text-pizarra first-letter:uppercase">{fechaLarga.format(new Date())}</p>
        <h1 className="mt-1 font-serif text-[2rem] leading-tight font-semibold">
          {saludo()}
          {nombre ? `, ${nombre}` : ""}
        </h1>
      </header>

      <Tablero
        racha={rachaVisible}
        protectores={estudio?.protectores}
        hecho={hechasHoy}
        objetivo={objetivo}
        xp={estudio?.xp_total}
        dias={diasExamen}
      />

      {/* Lo siguiente que toca: el foco de la pantalla. */}
      <section aria-labelledby="siguiente">
        {leccion && puedeLeccion ? (
          <div className="tarjeta overflow-hidden border-pino/40">
            <div className="bg-pino-boton px-5 pt-5 pb-4 text-sobre-pino">
              <p className="text-[0.8125rem] font-bold tracking-wide uppercase opacity-85">Sigue por aquí · Tema {leccion.numero}</p>
              <h2 id="siguiente" className="mt-1 line-clamp-3 font-serif text-[1.375rem] leading-snug font-semibold" title={leccion.titulo}>
                {leccion.titulo}
              </h2>
              <p className="cifras mt-2 text-sm opacity-90">
                Nivel {nivelVisible(leccion)} de 5 · {preguntasDeLeccion(leccion)} preguntas · {minutosDeLeccion(preguntasDeLeccion(leccion))} min
              </p>
            </div>
            <div className="p-4">
              <AccionesLeccion nodo={leccion} premium={suscrito} />
            </div>
          </div>
        ) : temaRespaldo && puedeLeccion ? (
          <div className="tarjeta p-5">
            <p className="antetitulo">Sigue por aquí</p>
            <h2 id="siguiente" className="mt-1 font-serif text-xl font-semibold">
              Tema {temaRespaldo.numero}. {temaRespaldo.titulo}
            </h2>
            <form action={crearTest} className="mt-4">
              <input type="hidden" name="modo" value="tema" />
              <input type="hidden" name="tema" value={temaRespaldo.tema_id} />
              <input type="hidden" name="num" value="10" />
              <Boton ancho>Hacer 10 preguntas</Boton>
            </form>
          </div>
        ) : !puedeLeccion ? (
          <div className="tarjeta p-5">
            <p className="antetitulo">Por hoy, hecho</p>
            <h2 id="siguiente" className="mt-1 font-serif text-xl font-semibold">
              Has usado tus {CUOTA_GRATIS} preguntas gratis de hoy
            </h2>
            <p className="mt-1 text-pizarra">Mañana tienes otras {CUOTA_GRATIS}. Con Premium sigues ahora, sin límite.</p>
            <div className="mt-4">
              <EnlaceBoton href="/suscripcion?motivo=cuota" ancho>
                Seguir con Premium
              </EnlaceBoton>
            </div>
          </div>
        ) : bloqueada ? (
          <div className="tarjeta p-5">
            <p className="antetitulo">Siguiente nivel · Tema {bloqueada.numero}</p>
            <h2 id="siguiente" className="mt-1 font-serif text-xl font-semibold">
              Has completado los niveles gratis
            </h2>
            <p className="mt-1 text-pizarra">Del nivel 3 al 5 y el examen de cada tema son de Premium.</p>
            <div className="mt-4">
              <EnlaceBoton href="/suscripcion?motivo=nivel" ancho>
                Ver Premium
              </EnlaceBoton>
            </div>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="practicar">
        <h2 id="practicar" className="mb-3 text-lg font-bold">
          Más formas de practicar
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <form action={crearTest}>
            <input type="hidden" name="modo" value="repaso" />
            <input type="hidden" name="num" value="10" />
            <button type="submit" disabled={sinRepaso} className="group block h-full w-full rounded-[1.25rem] disabled:cursor-not-allowed">
              <Acceso
                icono={<RotateCcw aria-hidden size={20} />}
                titulo="Repasa tus fallos"
                texto={falladas ? "Las que fallaste vuelven hasta que las aciertas." : "Aquí irán las preguntas que falles."}
                insignia={falladas ? String(falladas) : undefined}
              />
            </button>
          </form>
          <Link href="/app/simulacro" className="group block rounded-[1.25rem]">
            <Acceso icono={<Timer aria-hidden size={20} />} titulo="Simulacro" texto="Con tiempo y penalización, como el examen." />
          </Link>
          <Link
            href={suscrito ? "/app/nuevo" : "/suscripcion?motivo=personalizado"}
            className="group block rounded-[1.25rem]"
          >
            <Acceso
              icono={<SlidersHorizontal aria-hidden size={20} />}
              titulo="Test a medida"
              texto="Eliges temas y número de preguntas."
              bloqueado={!suscrito}
            />
          </Link>
        </div>
      </section>

      {!suscrito && cuota && (
        <section aria-label="Tu plan" className="flex items-center gap-4 rounded-2xl border border-dashed border-filete p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Plan gratis</p>
            <p className="cifras text-sm text-pizarra">
              Te quedan {cuota.tema} de {CUOTA_GRATIS} preguntas hoy
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-papel-hundido">
              <div className="h-full rounded-full bg-subrayador" style={{ width: `${(cuota.tema / CUOTA_GRATIS) * 100}%` }} />
            </div>
          </div>
          <EnlaceBoton href="/suscripcion" variante="suave" tamano="md" className="shrink-0">
            <Crown aria-hidden size={16} /> Premium
          </EnlaceBoton>
        </section>
      )}

      {flojos.length > 0 && (
        <section aria-labelledby="flojos">
          <h2 id="flojos" className="mb-3 text-lg font-bold">
            Temas para reforzar
          </h2>
          <ul className="tarjeta divide-y divide-filete">
            {flojos.map((t) => {
              const pct = Math.round((t.dominadas / t.vistas) * 100);
              return (
                <li key={t.tema_id} className="flex items-center gap-4 p-4">
                  <span className="cifras grid size-12 shrink-0 place-items-center rounded-full bg-teja-suave text-sm font-extrabold text-teja">
                    {pct}%
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-pizarra">Tema {t.numero}</span>
                    <span className="line-clamp-2 leading-snug font-semibold">{t.titulo}</span>
                  </span>
                  {suscrito && (
                    <form action={crearTest}>
                      <input type="hidden" name="modo" value="tema" />
                      <input type="hidden" name="tema" value={t.tema_id} />
                      <input type="hidden" name="num" value="20" />
                      <Boton variante="suave" tamano="md">
                        Repasar
                      </Boton>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {proximos.length > 0 && (
        <section aria-labelledby="despues">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="despues" className="text-lg font-bold">
              Después
            </h2>
            <Link href="/app/camino" className="enlace text-sm">
              Ver el camino
            </Link>
          </div>
          <ol className="tarjeta divide-y divide-filete">
            {proximos.map((t) => (
              <li key={t.tema_id} className="flex items-center gap-3 p-4">
                <span className="cifras grid size-10 shrink-0 place-items-center rounded-full border-2 border-filete font-extrabold text-pizarra">
                  {t.numero}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-semibold">{t.titulo}</span>
                  <span className="mt-1 block">
                    <Niveles nodo={t} />
                  </span>
                </span>
                {!suscrito && nivelVisible(t) >= 3 && <Lock aria-label="Premium" size={16} className="text-pizarra" />}
              </li>
            ))}
          </ol>
        </section>
      )}

      {intentos.length > 0 && (
        <section aria-labelledby="ultimos">
          <h2 id="ultimos" className="mb-3 text-lg font-bold">
            Tus últimos test
          </h2>
          <ul className="tarjeta divide-y divide-filete">
            {intentos.map((i) => {
              const total = i.preguntas.length;
              const ratio = total ? (i.aciertos ?? 0) / total : 0;
              return (
                <li key={i.id}>
                  <Link href={`/app/test/${i.id}`} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-papel-hundido/60">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{nombresModo[i.modo] ?? "Test"}</span>
                      <span className="text-sm text-pizarra">{fechaCorta.format(new Date(i.creado_en))}</span>
                    </span>
                    <span
                      className={`cifras rounded-full px-2.5 py-1 text-sm font-bold ${ratio >= 0.6 ? "bg-pino-suave text-pino" : "bg-teja-suave text-teja"}`}
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
