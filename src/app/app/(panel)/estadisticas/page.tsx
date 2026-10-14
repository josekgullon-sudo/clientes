import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Crown, Gauge, Lock, Target, TrendingUp, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { EnlaceBoton } from "@/components/boton";
import { Clara } from "@/components/mascota/clara";
import { Tablero } from "@/components/estudio/tablero";
import { estadisticasUsuario } from "@/lib/datos/estudio";
import { examenEstimado } from "@/lib/examen";
import { diasEntre, hoyMadrid, sumarDias } from "@/lib/seo/seleccion";

export const metadata: Metadata = { title: "Progreso", robots: { index: false } };

const pct = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${Math.round(Number(n) * 100)} %`);
const num = (n: number) => n.toLocaleString("es-ES");

function Barra({ valor, total, color = "bg-pino" }: { valor: number; total: number; color?: string }) {
  const ratio = total ? Math.min(1, valor / total) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-papel-hundido" role="img" aria-label={`${valor} de ${total}`}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

function Seccion({ titulo, icono, children, extra }: { titulo: string; icono?: ReactNode; children: ReactNode; extra?: ReactNode }) {
  const id = titulo.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <section aria-labelledby={id} className="tarjeta p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="flex items-center gap-2 text-lg font-bold">
          {icono}
          {titulo}
        </h2>
        {extra}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function Estadisticas() {
  const est = await estadisticasUsuario();
  if (!est) {
    return (
      <p role="status" className="tarjeta p-5">
        Las estadísticas no están disponibles ahora mismo. Vuelve a intentarlo en un rato.
      </p>
    );
  }

  const estimada = examenEstimado();
  const fecha = est.fecha_examen ?? estimada?.fecha ?? null;
  const dias = fecha ? diasEntre(hoyMadrid(), fecha) : null;
  const pendientes = est.temas.reduce((s, t) => s + Math.max(0, t.total - t.dominadas), 0);
  const diasRitmo = est.objetivo_diario > 0 ? Math.ceil(pendientes / est.objetivo_diario) : null;
  const llegada = diasRitmo !== null ? sumarDias(hoyMadrid(), diasRitmo) : null;
  const ritmoFecha = llegada
    ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${llegada}T00:00:00Z`))
    : null;
  const llegaATiempo = diasRitmo !== null && dias !== null && diasRitmo <= dias;
  const debiles = est.prediccion.debilidades ?? [];
  const maxHeat = Math.max(est.objetivo_diario, ...est.heatmap.map((d) => d.preguntas), 1);
  const conPreguntas = est.temas.filter((t) => t.total > 0);
  const sinPreguntas = est.temas.filter((t) => t.total === 0);
  const respuestasPrediccion = est.prediccion.respuestas ?? est.respuestas_total;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[2rem] leading-tight font-extrabold">Progreso</h1>

      <Tablero
        racha={est.racha_actual}
        protectores={est.protectores}
        hecho={est.preguntas_hoy}
        objetivo={est.objetivo_diario}
        xp={est.xp_total}
        dias={null}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_26rem] xl:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <Seccion
            titulo="Tu examen"
            icono={<CalendarDays aria-hidden size={18} className="text-pino" />}
            extra={
              <Link href="/app/cuenta" className="enlace text-sm">
                Cambiar
              </Link>
            }
          >
            {dias === null ? (
              <p>Aún no hay fecha. Ponla en tu cuenta y calculamos tu ritmo.</p>
            ) : (
              <>
                <p className="cifras font-display text-5xl leading-none font-extrabold">
                  {Math.max(0, dias)} <span className="font-sans text-lg font-semibold text-pizarra">días</span>
                </p>
                <p className="mt-2 text-sm text-pizarra">
                  {est.fecha_examen ? "Fecha que guardaste." : estimada ? `Estimación: ${estimada.etiqueta}. ${estimada.nota}` : ""}
                </p>
              </>
            )}
            {pendientes > 0 && (
              <p className={`mt-4 rounded-xl px-4 py-3 text-[0.95rem] ${llegaATiempo || dias === null ? "bg-pino-suave" : "bg-oro-suave"}`}>
                Te quedan <strong className="cifras">{num(pendientes)}</strong> preguntas por dominar.
                {ritmoFecha && diasRitmo !== null
                  ? ` A ${est.objetivo_diario} al día, terminas el banco sobre el ${ritmoFecha}${dias !== null ? (llegaATiempo ? ", antes del examen." : ". Sube el objetivo para llegar.") : "."}`
                  : ""}
              </p>
            )}
          </Seccion>

          <div className="grid gap-4 sm:grid-cols-2">
            <Seccion titulo="Acierto" icono={<Target aria-hidden size={18} className="text-pino" />}>
              <p className="cifras font-display text-5xl leading-none font-extrabold">{pct(est.acierto_global)}</p>
              <p className="mt-2 text-sm text-pizarra">{num(est.respuestas_total)} respuestas en total</p>
              <dl className="cifras mt-4 grid grid-cols-2 gap-2 text-center">
                {[
                  ["Últimos 7 días", est.acierto_7],
                  ["Últimos 30 días", est.acierto_30],
                ].map(([t, v]) => (
                  <div key={String(t)} className="flex flex-col-reverse rounded-xl bg-papel-hundido py-2">
                    <dt className="text-xs font-semibold text-pizarra">{t as string}</dt>
                    <dd className="font-extrabold">{est.premium ? pct(v as number | null) : <Lock aria-label="Premium" size={14} className="mx-auto my-1 text-pizarra" />}</dd>
                  </div>
                ))}
              </dl>
            </Seccion>

            <Seccion titulo="Por bloque" icono={<TrendingUp aria-hidden size={18} className="text-pino" />}>
              <ul className="flex flex-col gap-4">
                {est.bloques.map((b) => (
                  <li key={b.bloque}>
                    <div className="cifras mb-1.5 flex justify-between gap-3 text-sm">
                      <span className="font-bold">Bloque {b.bloque}</span>
                      <span className="text-pizarra">{b.total ? `${num(b.dominadas)} de ${num(b.total)} dominadas` : "En preparación"}</span>
                    </div>
                    <Barra valor={b.dominadas} total={b.total} />
                  </li>
                ))}
              </ul>
            </Seccion>
          </div>

          {est.premium ? (
            <>
              <Seccion titulo="Predicción de nota" icono={<Gauge aria-hidden size={18} className="text-pino" />}>
                {!est.prediccion.suficiente ? (
                  <div>
                    <p>Haz 100 preguntas para ver tu predicción.</p>
                    <div className="mt-3">
                      <Barra valor={respuestasPrediccion} total={100} color="bg-subrayador" />
                    </div>
                    <p className="cifras mt-1 text-sm text-pizarra">Llevas {respuestasPrediccion} de 100</p>
                  </div>
                ) : (
                  <>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {[
                        ["Parte 1 · bloque I", est.prediccion.parte1],
                        ["Parte 2 · bloque II", est.prediccion.parte2],
                      ].map(([etiqueta, parte]) => (
                        <div key={String(etiqueta)} className="rounded-xl bg-papel-hundido p-4">
                          <dt className="text-sm font-semibold text-pizarra">{etiqueta as string}</dt>
                          <dd>
                            <span className="cifras block font-display text-4xl font-extrabold">
                              {parte && typeof parte === "object" ? parte.nota.toLocaleString("es-ES") : "—"}
                              <span className="font-sans text-base font-semibold text-pizarra"> /50</span>
                            </span>
                            {parte && typeof parte === "object" && (
                              <span className="cifras block text-sm text-pizarra">
                                Entre {parte.bajo.toLocaleString("es-ES")} y {parte.alto.toLocaleString("es-ES")}
                              </span>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-sm text-pizarra">
                      Estimación con penalización de un tercio. No es la nota del examen.
                      {est.prediccion.parte2 ? " El bloque II aún tiene pocas preguntas: esa parte sale conservadora." : ""}
                    </p>
                  </>
                )}
              </Seccion>

              <div className="grid gap-4 sm:grid-cols-2">
                <Seccion titulo="Temas a reforzar" icono={<TriangleAlert aria-hidden size={18} className="text-teja" />}>
                  {debiles.length === 0 ? (
                    <p className="text-pizarra">Todavía no hay suficientes respuestas.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {debiles.slice(0, 5).map((d) => (
                        <li key={d.numero} className="flex items-baseline justify-between gap-3">
                          <span className="line-clamp-2 leading-snug">
                            <span className="font-bold">{d.numero}.</span> {d.titulo}
                          </span>
                          <span className="cifras shrink-0 rounded-full bg-teja-suave px-2 py-0.5 text-sm font-bold text-teja">
                            {Math.round(d.probabilidad * 100)} %
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Seccion>

                <Seccion titulo="Ritmo" icono={<Gauge aria-hidden size={18} className="text-pino" />}>
                  <p className="cifras font-display text-4xl font-extrabold">
                    {est.velocidad_media_s ? `${Math.round(Number(est.velocidad_media_s))} s` : "—"}
                  </p>
                  <p className="mt-1 text-sm text-pizarra">por pregunta. En el examen tienes unos 49 s (90 min para 110 preguntas).</p>
                </Seccion>
              </div>

              <Seccion titulo="Últimas 12 semanas">
                <div className="overflow-x-auto">
                  <div className="grid w-max grid-flow-col grid-rows-7 gap-1" role="img" aria-label="Preguntas respondidas por día">
                    {est.heatmap.map((d) => (
                      <span
                        key={d.dia}
                        title={`${d.dia}: ${d.preguntas}`}
                        className="size-3.5 rounded-[4px]"
                        style={{
                          background: d.preguntas
                            ? `color-mix(in srgb, var(--pino) ${25 + Math.round((d.preguntas / maxHeat) * 75)}%, var(--papel-hundido))`
                            : "var(--papel-hundido)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </Seccion>
            </>
          ) : (
            <section className="tarjeta overflow-hidden !border-[#a78bfa]">
              <div className="flex items-center gap-4 bg-morado-suave px-5 py-4">
                <Clara pose="premium" animada={false} className="size-20 shrink-0" />
                <div>
                  <p className="flex items-center gap-2 font-display text-xl font-black text-morado-texto">
                    <Crown aria-hidden size={20} /> Con Premium ves más
                  </p>
                  <p className="mt-1 text-sm font-semibold">El acierto global sigue siendo gratis. Esto añade Premium:</p>
                </div>
              </div>
              <ul className="divide-y divide-filete">
                {[
                  ["Predicción de nota", "Parte 1 y 2 sobre 50, con penalización, como el examen."],
                  ["Temas a reforzar", "Ordenados por lo que más pesa en tu nota."],
                  ["Tu ritmo", "Segundos por pregunta frente al tiempo del examen."],
                  ["Calendario", "Lo que has estudiado cada día de las últimas 12 semanas."],
                ].map(([t, d]) => (
                  <li key={t} className="flex items-start gap-3 px-5 py-3">
                    <Lock aria-hidden size={16} className="mt-1 shrink-0 text-pizarra" />
                    <span>
                      <span className="font-bold">{t}</span>
                      <span className="block text-sm text-pizarra">{d}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="p-5 pt-2">
                <EnlaceBoton href="/suscripcion?motivo=prediccion" variante="premium" ancho>
                  Ver Premium
                </EnlaceBoton>
              </div>
            </section>
          )}

        </div>
        <div className="min-w-0 lg:sticky lg:top-24">
          <Seccion titulo="Por tema">
            <ul className="flex flex-col gap-4">
              {conPreguntas.map((t) => (
                <li key={t.tema_id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="line-clamp-2 text-[0.95rem] leading-snug">
                      <span className="font-bold">{t.numero}.</span> {t.titulo}
                    </span>
                    <span className="cifras shrink-0 text-sm text-pizarra">
                      {t.dominadas}/{t.total}
                    </span>
                  </div>
                  <Barra valor={t.dominadas} total={t.total} />
                </li>
              ))}
            </ul>
            {sinPreguntas.length > 0 && (
              <details className="mt-5 border-t border-filete pt-3">
                <summary className="min-h-11 cursor-pointer content-center text-sm font-bold text-pizarra">
                  {sinPreguntas.length} temas en preparación
                </summary>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm text-pizarra">
                  {sinPreguntas.map((t) => (
                    <li key={t.tema_id}>
                      {t.numero}. {t.titulo}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Seccion>
        </div>
      </div>
    </div>
  );
}
