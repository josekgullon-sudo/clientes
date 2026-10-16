import {
  Activity,
  BookOpen,
  Crown,
  Euro,
  Percent,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DatosPanel } from "@/lib/admin/metricas";
import { eur } from "@/lib/sitio";
import { MarcoAdmin } from "./marco";

const fechaCorta = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Madrid",
});

const fechaLarga = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Madrid",
});

function euros(cents: number) {
  return eur.format(cents / 100);
}

function Tarjeta({ icono: Icono, valor, etiqueta }: { icono: LucideIcon; valor: string; etiqueta: string }) {
  return (
    <article className="rounded-2xl border-2 border-filete bg-superficie px-4 py-4">
      <Icono aria-hidden size={18} className="text-pino" />
      <p className="cifras mt-3 font-display text-3xl leading-none font-extrabold tracking-tight">{valor}</p>
      <p className="mt-2 text-sm font-semibold text-pizarra">{etiqueta}</p>
    </article>
  );
}

function Barras({ puntos, tono }: { puntos: { dia: string; total: number }[]; tono: string }) {
  const max = Math.max(1, ...puntos.map((p) => p.total));
  return (
    <div className="flex h-28 items-end gap-1">
      {puntos.map((p) => {
        const alto = p.total === 0 ? 3 : Math.max(8, Math.round((p.total / max) * 112));
        return (
          <div key={p.dia} className="flex h-full flex-1 items-end" title={`${p.dia}: ${p.total}`}>
            <div className={`w-full rounded-t ${p.total > 0 ? tono : "bg-filete"}`} style={{ height: alto }} />
          </div>
        );
      })}
    </div>
  );
}

function Eje({ puntos }: { puntos: { dia: string }[] }) {
  const primero = puntos[0]?.dia;
  const ultimo = puntos.at(-1)?.dia;
  if (!primero || !ultimo) return null;
  return (
    <p className="mt-2 flex justify-between text-xs font-semibold text-pizarra">
      <span>{fechaCorta.format(new Date(`${primero}T12:00:00Z`))}</span>
      <span>{fechaCorta.format(new Date(`${ultimo}T12:00:00Z`))}</span>
    </p>
  );
}

export function PanelAdmin({ datos }: { datos: DatosPanel }) {
  const { kpis } = datos;
  const maxLey = Math.max(1, ...datos.actividad.porLey.map((l) => l.respuestas));

  return (
    <MarcoAdmin activo="resumen">
      <p className="antetitulo mt-8">Resumen</p>

      <section aria-label="Cifras" className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tarjeta icono={Users} valor={String(kpis.usuarios)} etiqueta="Usuarios" />
        <Tarjeta icono={UserPlus} valor={String(kpis.hoy)} etiqueta="Altas hoy" />
        <Tarjeta icono={UserPlus} valor={String(kpis.siete)} etiqueta="Altas 7 días" />
        <Tarjeta icono={UserPlus} valor={String(kpis.treinta)} etiqueta="Altas 30 días" />
        <Tarjeta icono={Crown} valor={String(kpis.premiumMensual)} etiqueta="Premium mes" />
        <Tarjeta icono={Crown} valor={String(kpis.premiumAnual)} etiqueta="Premium año" />
        <Tarjeta icono={Users} valor={String(kpis.gratis)} etiqueta="Gratis" />
        <Tarjeta icono={Percent} valor={`${kpis.conversion} %`} etiqueta="Gratis → premium" />
        <Tarjeta icono={Euro} valor={euros(kpis.mrrCents)} etiqueta="MRR estimado" />
        <Tarjeta
          icono={Euro}
          valor={datos.stripe.disponible ? euros(datos.stripe.cents) : "—"}
          etiqueta={datos.stripe.disponible ? `Cobros 30 días · ${datos.stripe.cobros}` : "Stripe no conectado"}
        />
        <Tarjeta icono={Activity} valor={datos.actividad.disponible ? String(datos.actividad.activos7d) : "—"} etiqueta="Activos 7 días" />
      </section>

      {datos.embudo && datos.embudo.length > 0 && (
        <section aria-label="Embudo" className="mt-8">
          <h2 className="text-sm font-bold">Embudo</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {datos.embudo.map((paso) => {
              const base = datos.embudo?.[0]?.total ?? 0;
              const pct = base > 0 ? Math.round((paso.total / base) * 100) : 0;
              return (
                <article key={paso.id} className="rounded-2xl border-2 border-filete bg-superficie px-4 py-4">
                  <p className="cifras font-display text-3xl leading-none font-extrabold">{paso.total}</p>
                  <p className="mt-2 text-sm font-semibold text-pizarra">
                    {ETIQUETAS_EMBUDO[paso.id] ?? paso.id}
                    {paso.id !== "registro" && <span className="cifras"> · {pct} %</span>}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-8 grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border-2 border-filete bg-superficie p-4">
          <h2 className="text-sm font-bold">Altas por día</h2>
          <div className="mt-4">
            <Barras puntos={datos.altas} tono="bg-pino" />
            <Eje puntos={datos.altas} />
          </div>
        </article>
        <article className="rounded-2xl border-2 border-filete bg-superficie p-4">
          <h2 className="text-sm font-bold">Tests terminados</h2>
          <div className="mt-4">
            <Barras puntos={datos.actividad.tests} tono="bg-pino-vivo" />
            <Eje puntos={datos.actividad.tests} />
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border-2 border-filete bg-superficie p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <BookOpen aria-hidden size={16} className="text-pino" /> Uso por ley
          </h2>
          {datos.actividad.porLey.length === 0 ? (
            <p className="mt-4 text-sm text-pizarra">{datos.actividad.disponible ? "Aún no hay respuestas." : "Sin actividad."}</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {datos.actividad.porLey.map((l) => (
                <li key={l.ley}>
                  <p className="flex justify-between text-sm font-semibold">
                    <span>{l.ley}</span>
                    <span className="cifras text-pizarra">{l.respuestas}</span>
                  </p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-papel-hundido">
                    <div className="h-full rounded-full bg-pino" style={{ width: `${(l.respuestas / maxLey) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="rounded-2xl border-2 border-filete bg-superficie p-4">
          <h2 className="text-sm font-bold">Preguntas más falladas</h2>
          {datos.actividad.fallos.length === 0 ? (
            <p className="mt-4 text-sm text-pizarra">{datos.actividad.disponible ? "Nadie ha fallado todavía." : "Sin actividad."}</p>
          ) : (
            <ol className="mt-4 flex flex-col gap-3">
              {datos.actividad.fallos.map((f, i) => (
                <li key={f.id} className="flex gap-3">
                  <span className="cifras grid size-7 shrink-0 place-items-center rounded-full bg-teja-suave text-sm font-extrabold text-teja">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm leading-snug font-semibold">{f.enunciado}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-pizarra">
                      {f.ley} · art. {f.articulo} · {f.fallos} fallos
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>

      <section className="mt-8 grid gap-3 lg:grid-cols-2">
        <Tabla titulo="Altas recientes" columnas={["Correo", "Fecha", "Plan"]}>
          {datos.recientes.map((r) => (
            <tr key={r.id} className="border-t border-filete">
              <Celda>
                <Link href={`/admin/usuarios/${r.id}`} className="enlace">
                  {r.email}
                </Link>
              </Celda>
              <Celda>{fechaLarga.format(new Date(r.fecha))}</Celda>
              <Celda>{r.plan}</Celda>
            </tr>
          ))}
        </Tabla>
        <Tabla titulo="Suscripciones" columnas={["Correo", "Estado", "Plan", "Fin", "Cancela"]}>
          {datos.suscripciones.map((s) => (
            <tr key={s.id} className="border-t border-filete">
              <Celda>
                <Link href={`/admin/usuarios/${s.id}`} className="enlace">
                  {s.email}
                </Link>
              </Celda>
              <Celda>{s.estado}</Celda>
              <Celda>{s.plan}</Celda>
              <Celda>{s.fin ? fechaLarga.format(new Date(s.fin)) : "—"}</Celda>
              <Celda>{s.cancela === null ? "—" : s.cancela ? "Sí" : "No"}</Celda>
            </tr>
          ))}
        </Tabla>
      </section>
    </MarcoAdmin>
  );
}

const ETIQUETAS_EMBUDO: Record<string, string> = {
  registro: "Registros",
  test_inicio: "Empezaron un test",
  limite_gratis: "Llegaron al límite",
  vista_precios: "Vieron precios",
  checkout_inicio: "Abrieron el pago",
  pago_ok: "Pagaron",
};

function Tabla({ titulo, columnas, children }: { titulo: string; columnas: string[]; children: ReactNode }) {
  return (
    <article className="overflow-hidden rounded-2xl border-2 border-filete bg-superficie">
      <h2 className="px-4 pt-4 text-sm font-bold">{titulo}</h2>
      <div className="overflow-x-auto">
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="text-xs font-bold tracking-wide text-pizarra uppercase">
              {columnas.map((c) => (
                <th key={c} className="px-4 py-2 font-bold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </article>
  );
}

function Celda({ children }: { children: ReactNode }) {
  return <td className="px-4 py-2.5 font-semibold whitespace-nowrap">{children}</td>;
}
