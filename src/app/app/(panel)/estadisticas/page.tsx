import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Boton, EnlaceBoton } from "@/components/boton";
import { Anillo } from "@/components/estudio/anillo";
import { Racha } from "@/components/estudio/racha";
import { caminoTemas, estadisticasUsuario } from "@/lib/datos/estudio";
import { minutosDeLeccion, preguntasDeLeccion, siguienteLeccion } from "@/lib/estudio/camino";
import { examenEstimado } from "@/lib/examen";
import { diasEntre, hoyMadrid, sumarDias } from "@/lib/seo/seleccion";
import { crearTest } from "../../acciones";

export const metadata: Metadata = { title: "Progreso", robots: { index: false } };

const pct = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${Math.round(Number(n) * 100)} %`);

function Premium({ activo, children, texto }: { activo: boolean; children: ReactNode; texto: string }) {
  if (activo) return <>{children}</>;
  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="pointer-events-none blur-[6px] select-none" aria-hidden="true">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-papel/70 p-4 text-center">
        <p className="font-semibold">{texto}</p>
        <EnlaceBoton href="/suscripcion?motivo=prediccion">Ver Premium</EnlaceBoton>
      </div>
    </div>
  );
}

export default async function Estadisticas() {
  const [est, camino] = await Promise.all([estadisticasUsuario(), caminoTemas()]);
  if (!est) {
    return (
      <p role="status">
        Las estadísticas llegan cuando se aplica la migración de Supabase `20261012130000_estadisticas.sql`.
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
    ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${llegada}T00:00:00Z`))
    : null;
  const leccion = camino ? siguienteLeccion(camino, est.premium) : null;
  const siguiente = leccion
    ? { tema_id: leccion.tema_id, numero: leccion.numero, preguntas: preguntasDeLeccion(leccion), modo: "leccion" as const }
    : (() => {
        const t = est.temas.find((x) => x.total > 0 && x.dominadas < x.total) ?? est.temas.find((x) => x.total > 0);
        return t ? { tema_id: t.tema_id, numero: t.numero, preguntas: 10, modo: "tema" as const } : null;
      })();
  const debiles = est.prediccion.debilidades ?? [];
  const maxHeat = Math.max(est.objetivo_diario, ...est.heatmap.map((d) => d.preguntas), 1);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex items-center gap-4">
        <Anillo hecho={est.preguntas_hoy} objetivo={est.objetivo_diario} />
        <div>
          <h1 className="font-serif text-[2rem] leading-tight font-semibold">Tu progreso</h1>
          <Racha dias={est.racha_actual} protectores={est.protectores} />
          <p className="text-[0.95rem] text-pizarra">Mejor racha: {est.racha_maxima}. Objetivo: {est.objetivo_diario} al día.</p>
        </div>
      </section>

      {siguiente && (
        <form action={crearTest}>
          <input type="hidden" name="modo" value={siguiente.modo} />
          <input type="hidden" name="tema" value={siguiente.tema_id} />
          <input type="hidden" name="num" value={String(siguiente.preguntas)} />
          <Boton ancho>
            Continuar: Tema {siguiente.numero} · {siguiente.preguntas} preguntas · {minutosDeLeccion(siguiente.preguntas)} min
          </Boton>
        </form>
      )}

      <section aria-labelledby="examen" className="rounded-xl border border-filete p-4">
        <h2 id="examen" className="font-serif text-xl font-semibold">Días hasta el examen</h2>
        {dias === null ? (
          <p className="mt-2">Aún no hay fecha. Puedes ponerla en tu cuenta.</p>
        ) : (
          <p className="mt-2 font-serif text-4xl font-semibold">{Math.max(0, dias)}</p>
        )}
        <p className="mt-1 text-[0.95rem] text-pizarra">
          {est.fecha_examen ? "Fecha que guardaste." : estimada ? `Estimación: ${estimada.etiqueta}. ${estimada.nota}` : ""}
        </p>
        <p className="mt-2">
          Te quedan {pendientes} preguntas por dominar.
          {ritmoFecha && diasRitmo !== null ? ` A ${est.objetivo_diario} al día llegas sobre el ${ritmoFecha}.` : ""}
        </p>
        <p className="mt-2 text-[0.95rem]">
          <Link href="/app/cuenta" className="font-semibold underline underline-offset-4">Cambiar objetivo o fecha</Link>
        </p>
      </section>

      <section aria-labelledby="acierto">
        <h2 id="acierto" className="font-serif text-xl font-semibold">Porcentaje de acierto</h2>
        <dl className="mt-3 grid grid-cols-3 border-y border-filete text-center">
          <div className="py-3">
            <dt className="text-[0.9rem] text-pizarra">Global</dt>
            <dd className="text-xl font-semibold">{pct(est.acierto_global)}</dd>
          </div>
          <div className="border-x border-filete py-3">
            <dt className="text-[0.9rem] text-pizarra">7 días</dt>
            <dd className="text-xl font-semibold">{est.premium ? pct(est.acierto_7) : "·"}</dd>
          </div>
          <div className="py-3">
            <dt className="text-[0.9rem] text-pizarra">30 días</dt>
            <dd className="text-xl font-semibold">{est.premium ? pct(est.acierto_30) : "·"}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[0.95rem] text-pizarra">{est.respuestas_total} respuestas en total.</p>
      </section>

      <section aria-labelledby="bloques">
        <h2 id="bloques" className="font-serif text-xl font-semibold">Por bloque</h2>
        <ul className="mt-2">
          {est.bloques.map((b) => {
            const ratio = b.total ? b.dominadas / b.total : 0;
            return (
              <li key={b.bloque} className="border-b border-filete py-3">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">Bloque {b.bloque}</span>
                  <span className="text-pizarra">{b.total ? `${b.dominadas}/${b.total}` : "Sin preguntas"}</span>
                </div>
                {b.total > 0 && (
                  <div className="mt-2 h-2 rounded-full bg-filete" role="img" aria-label={`${Math.round(ratio * 100)} % dominado`}>
                    <div className="h-full rounded-full bg-pino" style={{ width: `${ratio * 100}%` }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="prediccion">
        <h2 id="prediccion" className="font-serif text-xl font-semibold">Predicción de nota</h2>
        <p className="mt-1 text-[0.95rem] text-pizarra">
          Parte 1 (bloque I) y parte 2 (bloque II), sobre 50, con penalización de un tercio. Es una estimación, no la nota del examen.
        </p>
        {!est.prediccion.suficiente ? (
          <p className="mt-3 rounded-xl border border-filete bg-papel-hundido p-4">
            Haz 100 preguntas para ver tu predicción. Llevas {est.prediccion.respuestas ?? est.respuestas_total}.
          </p>
        ) : (
          <Premium activo={est.premium} texto="La predicción es de Premium">
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                ["Parte 1 · bloque I", est.prediccion.parte1],
                ["Parte 2 · bloque II", est.prediccion.parte2],
              ].map(([etiqueta, parte]) => (
                <div key={String(etiqueta)} className="rounded-xl border border-filete p-4">
                  <dt className="text-[0.95rem] text-pizarra">{etiqueta as string}</dt>
                  <dd className="font-serif text-4xl font-semibold">
                    {parte && typeof parte === "object" ? parte.nota.toLocaleString("es-ES") : "—"}
                  </dd>
                  {parte && typeof parte === "object" && (
                    <p className="text-[0.95rem] text-pizarra">Entre {parte.bajo.toLocaleString("es-ES")} y {parte.alto.toLocaleString("es-ES")}</p>
                  )}
                </div>
              ))}
            </dl>
          </Premium>
        )}
        {est.prediccion.parte2 && est.premium && (
          <p className="mt-2 text-[0.95rem] text-pizarra">
            El bloque II todavía no tiene banco completo: esa parte sale muy conservadora hasta que haya preguntas.
          </p>
        )}
      </section>

      <section aria-labelledby="debil">
        <h2 id="debil" className="font-serif text-xl font-semibold">Temas a reforzar</h2>
        <Premium activo={est.premium} texto="Las debilidades ponderadas son de Premium">
          <ul className="mt-2">
            {debiles.length === 0 && <li className="py-3 text-pizarra">Todavía no hay temas con preguntas.</li>}
            {debiles.map((d) => (
              <li key={d.numero} className="flex items-baseline justify-between gap-3 border-b border-filete py-3">
                <span>Tema {d.numero}. {d.titulo}</span>
                <span className="shrink-0 text-pizarra">{Math.round(d.probabilidad * 100)} %</span>
              </li>
            ))}
          </ul>
        </Premium>
      </section>

      <section aria-labelledby="vel">
        <h2 id="vel" className="font-serif text-xl font-semibold">Velocidad</h2>
        <Premium activo={est.premium} texto="El ritmo por pregunta es de Premium">
          <p className="mt-2">
            {est.velocidad_media_s ? `${Math.round(Number(est.velocidad_media_s))} s por pregunta` : "Aún no hay tiempos."}
            <span className="text-pizarra"> · el examen va a unos 49 s (90 min / 110 preguntas).</span>
          </p>
        </Premium>
      </section>

      <section aria-labelledby="heat">
        <h2 id="heat" className="font-serif text-xl font-semibold">Últimas 12 semanas</h2>
        <Premium activo={est.premium} texto="El calendario es de Premium">
          <div className="mt-3 grid grid-flow-col grid-rows-7 gap-1" aria-label="Preguntas por día">
            {est.heatmap.map((d) => (
              <span
                key={d.dia}
                title={`${d.dia}: ${d.preguntas}`}
                className="size-3 rounded-sm"
                style={{ background: `color-mix(in srgb, var(--pino) ${Math.round((d.preguntas / maxHeat) * 100)}%, var(--filete))` }}
              />
            ))}
          </div>
        </Premium>
      </section>

      <section aria-labelledby="temas">
        <h2 id="temas" className="font-serif text-xl font-semibold">Por tema</h2>
        <ul>
          {est.temas.map((t) => {
            const ratio = t.total ? t.dominadas / t.total : 0;
            return (
              <li key={t.tema_id} className="border-b border-filete py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="line-clamp-2"><span className="font-semibold">{t.numero}.</span> {t.titulo}</span>
                  <span className="shrink-0 text-[0.9rem] text-pizarra">{t.total ? `${t.dominadas}/${t.total}` : "En preparación"}</span>
                </div>
                {t.total > 0 && (
                  <div className="mt-2 h-1.5 rounded-full bg-filete" role="img" aria-label={`${t.dominadas} de ${t.total}`}>
                    <div className="h-full rounded-full bg-pino" style={{ width: `${ratio * 100}%` }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
