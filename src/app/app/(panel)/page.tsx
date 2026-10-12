import type { Metadata } from "next";
import Link from "next/link";
import { Boton, EnlaceBoton } from "@/components/boton";
import { Anillo } from "@/components/estudio/anillo";
import { Camino } from "@/components/estudio/camino";
import { Racha } from "@/components/estudio/racha";
import { Evento } from "@/components/evento";
import { caminoTemas, estadisticasUsuario } from "@/lib/datos/estudio";
import { minutosDeLeccion, preguntasDeLeccion, siguienteBloqueado, siguienteLeccion } from "@/lib/estudio/camino";
import { diasEntre, hoyMadrid } from "@/lib/seo/seleccion";
import { examenEstimado } from "@/lib/examen";
import { cuotaRestante, falladasPendientes, progresoPorTema, rachaActual, ultimosIntentos, usuarioActual } from "@/lib/datos/usuario";
import { crearTest } from "../acciones";

export const metadata: Metadata = { title: "Tu panel" };

const nombresModo = {
  tema: "Test por tema",
  mixto: "Test mezclado",
  falladas: "Repaso de fallos",
  simulacro: "Simulacro",
  leccion: "Lección",
  repaso: "Repaso",
  salto: "Test de salto",
};
const fecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });

export default async function Panel({ searchParams }: PageProps<"/app">) {
  const q = await searchParams;
  const { suscrito } = await usuarioActual();
  const [progreso, racha, intentos, falladas, cuota, estudio, camino] = await Promise.all([
    progresoPorTema(),
    rachaActual(),
    ultimosIntentos(),
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
  const preguntas = leccion ? preguntasDeLeccion(leccion) : 10;
  const puedeLeccion = suscrito || !cuota || cuota.tema > 0;
  const temaRespaldo = !camino ? progreso.find((t) => t.total > 0) : null;

  const flojos = progreso
    .filter((t) => t.vistas >= 5 && t.dominadas / t.vistas < 0.6)
    .sort((a, b) => a.dominadas / a.vistas - b.dominadas / b.vistas)
    .slice(0, 3);
  const bloques = [...new Set(progreso.map((t) => t.bloque))];

  return (
    <div className="flex flex-col gap-10">
      {q.suscripcion === "ok" && <Evento nombre="purchase" />}
      {q.suscripcion === "ok" && (
        <section className="rounded-xl border border-pino bg-pino-suave p-4">
          <h2 className="font-serif text-xl font-semibold">Ya eres Premium</h2>
          <p className="mt-1">El límite diario ya no aplica. Un buen siguiente paso es el simulacro.</p>
          <div className="mt-3">
            <EnlaceBoton href="/app/simulacro">Hacer un simulacro</EnlaceBoton>
          </div>
        </section>
      )}
      <section className="flex items-center gap-4">
        <Anillo hecho={hechasHoy} objetivo={objetivo} />
        <div>
          <h1 className="font-serif text-[2rem] leading-tight font-semibold">Tu estudio</h1>
          <Racha dias={rachaVisible} protectores={estudio?.protectores} />
          <p className="text-[0.95rem] text-pizarra">
            Hoy {hechasHoy} de {objetivo}
            {estudio ? ` · ${estudio.xp_total} XP` : ""}
            {diasExamen !== null && diasExamen >= 0 ? ` · ${diasExamen} días para el examen` : ""}
          </p>
        </div>
      </section>

      <section aria-label="Empezar" className="flex flex-col gap-3">
        {temaRespaldo && puedeLeccion ? (
          <form action={crearTest}>
            <input type="hidden" name="modo" value="tema" />
            <input type="hidden" name="tema" value={temaRespaldo.tema_id} />
            <input type="hidden" name="num" value="10" />
            <Boton ancho>Continuar: Tema {temaRespaldo.numero} · 10 preguntas · 5 min</Boton>
          </form>
        ) : leccion && puedeLeccion ? (
          <form action={crearTest}>
            <input type="hidden" name="modo" value="leccion" />
            <input type="hidden" name="tema" value={leccion.tema_id} />
            <input type="hidden" name="num" value={String(preguntas)} />
            <Boton ancho>
              Continuar: Tema {leccion.numero} · {preguntas} preguntas · {minutosDeLeccion(preguntas)} min
            </Boton>
          </form>
        ) : !puedeLeccion ? (
          <EnlaceBoton href="/suscripcion?motivo=cuota" ancho>
            Has hecho las 10 de hoy · Ver Premium
          </EnlaceBoton>
        ) : bloqueada ? (
          <EnlaceBoton href="/suscripcion?motivo=nivel" ancho>
            Tema {bloqueada.numero} sigue en el nivel {bloqueada.nivel > 0 ? bloqueada.nivel : 1} · Ver Premium
          </EnlaceBoton>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <form action={crearTest} className="w-full">
            <input type="hidden" name="modo" value="repaso" />
            <input type="hidden" name="num" value="10" />
            <Boton variante="secundario" ancho disabled={falladas === 0 || (!suscrito && !!cuota && cuota.repaso === 0)}>
              Repasar fallos{falladas ? ` (${falladas})` : ""}
            </Boton>
          </form>
          <EnlaceBoton href="/app/simulacro" variante="secundario" ancho>
            Simulacro{!suscrito ? " de prueba" : ""}
          </EnlaceBoton>
          {suscrito ? (
            <EnlaceBoton href="/app/nuevo" variante="secundario" ancho>
              Test personalizado
            </EnlaceBoton>
          ) : (
            <EnlaceBoton href="/suscripcion?motivo=personalizado" variante="secundario" ancho>
              Test personalizado
            </EnlaceBoton>
          )}
        </div>
      </section>

      {!suscrito && (
        <section className="rounded-xl border border-filete p-4">
          <h2 className="font-serif text-xl font-semibold">Plan gratis</h2>
          <p className="mt-1">
            Una lección al día en los niveles 1 y 2, y el repaso de esos fallos. Premium abre el resto del camino, la predicción y los simulacros.
          </p>
          <div className="mt-4">
            <EnlaceBoton href="/suscripcion" variante="secundario">Ver planes</EnlaceBoton>
          </div>
        </section>
      )}

      {flojos.length > 0 && (
        <section aria-labelledby="flojos">
          <h2 id="flojos" className="font-serif text-xl font-semibold">
            Temas para reforzar
          </h2>
          <ul className="mt-2">
            {flojos.map((t) => (
              <li key={t.tema_id} className="flex items-center justify-between gap-4 border-b border-filete py-3">
                <span>
                  <span className="font-semibold">Tema {t.numero}.</span> {t.titulo}
                  <span className="block text-[0.95rem] text-pizarra">
                    Aciertas {Math.round((t.dominadas / t.vistas) * 100)} % de lo que has visto
                  </span>
                </span>
                {suscrito && (
                  <form action={crearTest}>
                    <input type="hidden" name="modo" value="tema" />
                    <input type="hidden" name="tema" value={t.tema_id} />
                    <input type="hidden" name="num" value="20" />
                    <button className="min-h-11 shrink-0 px-2 font-semibold underline underline-offset-4">Repasar</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {camino && (
        <section aria-labelledby="camino">
          <h2 id="camino" className="font-serif text-xl font-semibold">Camino de temas</h2>
          <p className="mt-1 mb-4 text-[0.95rem] text-pizarra">
            Cinco niveles por tema. Una lección se aprueba con un 70 %. El nivel 5 es el examen del tema.
          </p>
          <Camino temas={camino} premium={suscrito} puedeLeccion={puedeLeccion} />
        </section>
      )}

      <section aria-labelledby="progreso">
        <h2 id="progreso" className="font-serif text-xl font-semibold">
          Progreso por tema
        </h2>
        <p className="mt-1 text-[0.95rem] text-pizarra">
          Dominadas: preguntas que acertaste la última vez que te salieron.
        </p>
        {bloques.map((b) => (
          <div key={b} className="mt-4">
            <h3 className="text-[0.95rem] font-semibold text-pizarra">Bloque {b}</h3>
            <ul>
              {progreso
                .filter((t) => t.bloque === b)
                .map((t) => {
                  const pct = t.total ? (t.dominadas / t.total) * 100 : 0;
                  return (
                    <li key={t.tema_id} className="border-b border-filete py-3">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="line-clamp-2">
                          <span className="font-semibold">{t.numero}.</span> {t.titulo}
                        </span>
                        <span className="shrink-0 text-[0.9rem] text-pizarra">
                          {t.total ? `${t.dominadas}/${t.total}` : "Sin preguntas"}
                        </span>
                      </div>
                      {t.total > 0 && (
                        <div
                          className="mt-2 h-1.5 bg-filete"
                          role="img"
                          aria-label={`${t.dominadas} de ${t.total} preguntas dominadas`}
                        >
                          <div className="h-full bg-pino" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>

      {intentos.length > 0 && (
        <section aria-labelledby="ultimos">
          <h2 id="ultimos" className="font-serif text-xl font-semibold">
            Últimos test
          </h2>
          <ul className="mt-2">
            {intentos.map((i) => (
              <li key={i.id} className="border-b border-filete">
                <Link href={`/app/test/${i.id}`} className="flex min-h-12 items-center justify-between gap-4 py-2 hover:underline">
                  <span>
                    {nombresModo[i.modo as keyof typeof nombresModo]}
                    <span className="block text-[0.9rem] text-pizarra">{fecha.format(new Date(i.creado_en))}</span>
                  </span>
                  <span className="shrink-0">
                    {i.aciertos}/{i.preguntas.length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
