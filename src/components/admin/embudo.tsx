import Link from "next/link";
import { MarcoAdmin } from "@/components/admin/marco";
import { PASOS_EMBUDO, porcentaje, type PasoEmbudo } from "@/lib/admin/embudo";

export function EmbudoVista({
  desde,
  hasta,
  origen,
  fuentes,
  pasos,
  fechasInvalidas,
}: {
  desde: string;
  hasta: string;
  origen: string;
  fuentes: string[];
  pasos: PasoEmbudo[] | null;
  fechasInvalidas: boolean;
}) {
  const porId = new Map((pasos ?? []).map((p) => [p.id, p.total]));
  const base = porId.get("registro") ?? 0;
  const ordenados = PASOS_EMBUDO.map((p) => ({ ...p, total: porId.get(p.id) ?? 0 }));

  return (
    <MarcoAdmin activo="embudo">
      <p className="antetitulo mt-8">Embudo</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">De la entrada al pago</h1>
      <p className="mt-2 max-w-xl text-pizarra">Cada paso cuenta a quien lo hizo en esas fechas. El porcentaje es sobre los registros del mismo periodo.</p>

      <form action="/admin/embudo" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Desde
          <input type="date" name="desde" defaultValue={desde} className="min-h-12 rounded-xl border-2 border-filete bg-superficie px-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Hasta
          <input type="date" name="hasta" defaultValue={hasta} className="min-h-12 rounded-xl border-2 border-filete bg-superficie px-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Origen
          <select name="origen" defaultValue={origen || "todos"} className="min-h-12 rounded-xl border-2 border-filete bg-superficie px-3">
            <option value="todos">Todos</option>
            <option value="gclid">Con clic de Google</option>
            {fuentes
              .filter((f) => f !== "gclid")
              .map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            {origen && origen !== "gclid" && !fuentes.includes(origen) && <option value={origen}>{origen}</option>}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="min-h-12 w-full rounded-xl bg-pino px-5 font-bold text-sobre-pino">
            Filtrar
          </button>
        </div>
      </form>

      {fechasInvalidas ? (
        <p className="mt-4 text-teja">Esas fechas no valen. El hasta tiene que ser el mismo día o uno posterior.</p>
      ) : !pasos ? (
        <p className="mt-8 text-pizarra">No se ha podido leer el embudo. Revisa la clave de servicio y la migración del CRM.</p>
      ) : (
        <ol className="mt-8 flex flex-col gap-3">
          {ordenados.map((paso, i) => {
            const anterior = i === 0 ? null : ordenados[i - 1]?.total ?? 0;
            const delRegistro = i === 0 ? null : porcentaje(paso.total, base);
            const delAnterior = anterior == null ? null : porcentaje(paso.total, anterior);
            const ancho = base > 0 ? Math.max(paso.total > 0 ? 8 : 0, Math.min(100, Math.round((paso.total / base) * 100))) : 0;
            return (
              <li key={paso.id} className="rounded-2xl border-2 border-filete bg-superficie px-4 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold">{paso.texto}</p>
                  <p className="cifras font-display text-2xl font-extrabold">{paso.total}</p>
                </div>
                {i > 0 && (
                  <p className="mt-1 text-sm text-pizarra">
                    {delRegistro == null ? "Sin registros en este periodo" : `${delRegistro} % de los registros`}
                    {delAnterior != null ? ` · ${delAnterior} % del paso anterior` : ""}
                  </p>
                )}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-papel-hundido">
                  <div className="h-full rounded-full bg-pino" style={{ width: `${i === 0 ? (paso.total > 0 ? 100 : 0) : ancho}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </MarcoAdmin>
  );
}
