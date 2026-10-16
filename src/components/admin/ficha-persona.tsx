import Link from "next/link";
import type { ReactNode } from "react";
import { MarcoAdmin } from "@/components/admin/marco";
import {
  ETIQUETAS_EVENTO,
  PASOS_FICHA,
  duracionLegible,
  fechaLegible,
  metaLegible,
  modoLegible,
  notaLegible,
  origenLegible,
  planLegible,
  type FichaPersona,
  type SesionesFicha,
} from "@/lib/admin/personas";

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold">{titulo}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function FichaPersonaVista({ ficha, sesiones }: { ficha: FichaPersona; sesiones: SesionesFicha | null }) {
  const u = ficha.usuario;
  const fechas = new Map(ficha.embudo.map((p) => [p.tipo, p.fecha]));
  if (!fechas.has("registro")) fechas.set("registro", u.registro);
  const origen = origenLegible(u.origen);
  const pasosVisibles = PASOS_FICHA.filter((p) => p.id === "registro" || p.id === "onboarding_fin" || p.id === "test_inicio" || p.id === "limite_gratis" || p.id === "vista_precios" || p.id === "checkout_inicio" || p.id === "pago_ok" || fechas.has(p.id));

  return (
    <MarcoAdmin activo="personas">
      <p className="mt-8">
        <Link href="/admin/usuarios" className="text-sm font-bold text-pizarra">
          ← Personas
        </Link>
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight break-all">{u.email ?? "Sin correo"}</h1>
      <p className="mt-2 text-pizarra">
        Registro {fechaLegible(u.registro, true)} · Último acceso {fechaLegible(u.ultimo_acceso, true)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex min-h-9 items-center rounded-full bg-pino-suave px-3 text-sm font-bold text-pino">
          {planLegible(u.plan, u.estado)}
        </span>
        <span className="inline-flex min-h-9 items-center rounded-full bg-oro-suave px-3 text-sm font-bold text-oro-texto">
          <span className="cifras">{u.xp}</span>&nbsp;XP · racha <span className="cifras">&nbsp;{u.racha}</span>
        </span>
        {u.stripe_customer_id && (
          <a
            href={`https://dashboard.stripe.com/customers/${encodeURIComponent(u.stripe_customer_id)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center rounded-full border-2 border-filete px-3 text-sm font-bold"
          >
            Abrir en Stripe
          </a>
        )}
      </div>

      <Bloque titulo="Origen">
        {origen.length === 0 ? (
          <p className="text-sm text-pizarra">Sin origen guardado.</p>
        ) : (
          <dl className="grid gap-2 sm:grid-cols-2">
            {origen.map((o) => (
              <div key={o.etiqueta} className="rounded-2xl border-2 border-filete bg-superficie px-4 py-3">
                <dt className="text-xs font-bold tracking-wide text-pizarra uppercase">{o.etiqueta}</dt>
                <dd className="mt-1 text-sm font-semibold break-all">{o.valor}</dd>
              </div>
            ))}
          </dl>
        )}
      </Bloque>

      <Bloque titulo="Embudo">
        <ol className="grid gap-2 sm:grid-cols-2">
          {pasosVisibles.map((p) => {
            const fecha = fechas.get(p.id);
            return (
              <li key={p.id} className="rounded-2xl border-2 border-filete bg-superficie px-4 py-3">
                <p className="text-sm font-bold">{p.texto}</p>
                <p className="mt-1 text-sm text-pizarra">{fecha ? fechaLegible(fecha, true) : "Aún no"}</p>
              </li>
            );
          })}
        </ol>
      </Bloque>

      <Bloque titulo="Tests">
        {ficha.tests.length === 0 ? (
          <p className="text-sm text-pizarra">Todavía no ha hecho ningún test.</p>
        ) : (
          <>
            <ul className="flex flex-col gap-3 md:hidden">
              {ficha.tests.map((t) => (
                <li key={t.id} className="rounded-2xl border-2 border-filete bg-superficie p-4">
                  <p className="font-bold">
                    {modoLegible(t.modo)} · {t.terminado ? "Terminado" : "Abandonado"}
                  </p>
                  <p className="mt-1 text-sm text-pizarra">{t.tema || t.ley || "Varios temas"}</p>
                  <p className="mt-1 text-sm text-pizarra">
                    Nota {notaLegible(t.nota)} · {duracionLegible(t.duracion)} · {fechaLegible(t.fecha, true)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-hidden rounded-2xl border-2 border-filete bg-superficie md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs font-bold tracking-wide text-pizarra uppercase">
                      {["Modo", "Tema o ley", "Nota", "Fecha", "Duración", "Estado"].map((c) => (
                        <th key={c} className="px-4 py-3 font-bold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.tests.map((t) => (
                      <tr key={t.id} className="border-t border-filete">
                        <td className="px-4 py-3 font-semibold">{modoLegible(t.modo)}</td>
                        <td className="px-4 py-3">{t.tema || t.ley || "—"}</td>
                        <td className="cifras px-4 py-3">{notaLegible(t.nota)}</td>
                        <td className="px-4 py-3">{fechaLegible(t.fecha, true)}</td>
                        <td className="px-4 py-3">{duracionLegible(t.duracion)}</td>
                        <td className="px-4 py-3">{t.terminado ? "Terminado" : "Abandonado"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Bloque>

      <Bloque titulo="Progreso por tema">
        {ficha.progreso.length === 0 ? (
          <p className="text-sm text-pizarra">Sin temas en esta oposición.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {ficha.progreso.map((t) => {
              const pct = t.total > 0 ? Math.round((t.dominadas / t.total) * 100) : 0;
              return (
                <li key={t.numero} className="rounded-2xl border-2 border-filete bg-superficie px-4 py-3">
                  <p className="flex justify-between gap-3 text-sm font-semibold">
                    <span>
                      {t.numero}. {t.titulo}
                    </span>
                    <span className="cifras shrink-0 text-pizarra">
                      {t.dominadas}/{t.total}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-pizarra">
                    Bloque {t.bloque} · {t.vistas} vistas
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-papel-hundido">
                    <div className="h-full rounded-full bg-pino" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Bloque>

      <Bloque titulo="Preguntas más falladas">
        {ficha.falladas.length === 0 ? (
          <p className="text-sm text-pizarra">No hay fallos guardados.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {ficha.falladas.map((f, i) => (
              <li key={f.id} className="flex gap-3 rounded-2xl border-2 border-filete bg-superficie p-4">
                <span className="cifras grid size-7 shrink-0 place-items-center rounded-full bg-teja-suave text-sm font-extrabold text-teja">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm leading-snug font-semibold">{f.enunciado}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-pizarra">
                    {f.ley} · art. {f.articulo} · {f.fallos} fallos de {f.respuestas}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Bloque>

      <Bloque titulo="Actividad">
        {ficha.eventos.length === 0 ? (
          <p className="text-sm text-pizarra">Todavía no hay hechos registrados.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {ficha.eventos.map((e) => {
              const extra = metaLegible(e.meta);
              return (
                <li key={e.id} className="rounded-2xl border-2 border-filete bg-superficie px-4 py-3">
                  <p className="text-sm font-bold">{ETIQUETAS_EVENTO[e.tipo] ?? e.tipo}</p>
                  <p className="mt-1 text-sm text-pizarra">
                    {fechaLegible(e.creado_en, true)}
                    {extra ? ` · ${extra}` : ""}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </Bloque>

      <Bloque titulo="Tiempo de uso">
        {!sesiones ? (
          <p className="text-sm text-pizarra">No se ha podido leer el tiempo de uso.</p>
        ) : sesiones.total === 0 ? (
          <p className="text-sm text-pizarra">Todavía no hay sesiones.</p>
        ) : (
          <>
            <p className="text-sm text-pizarra">
              <span className="cifras font-bold text-tinta">{duracionLegible(sesiones.segundos)}</span> en{" "}
              <span className="cifras font-bold text-tinta">{sesiones.total}</span> {sesiones.total === 1 ? "sesión" : "sesiones"}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {sesiones.recientes.map((s) => (
                <li key={s.inicio} className="rounded-2xl border-2 border-filete bg-superficie px-4 py-3 text-sm">
                  <p className="font-semibold">
                    {fechaLegible(s.inicio, true)} – {fechaLegible(s.ultimo_latido, true)}
                  </p>
                  <p className="mt-1 text-pizarra">{s.segundos > 0 ? duracionLegible(s.segundos) : "Menos de un minuto"}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Bloque>

      <Bloque titulo="Notas">
        {ficha.notas.length === 0 ? (
          <p className="text-sm text-pizarra">Sin notas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ficha.notas.map((n) => (
              <li key={n.id} className="rounded-2xl border-2 border-filete bg-superficie px-4 py-3 text-sm">
                <p>{n.texto}</p>
                <p className="mt-1 text-pizarra">{fechaLegible(n.creado_en, true)}</p>
              </li>
            ))}
          </ul>
        )}
      </Bloque>
    </MarcoAdmin>
  );
}
