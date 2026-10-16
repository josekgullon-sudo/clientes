import Link from "next/link";
import { MarcoAdmin } from "@/components/admin/marco";
import {
  FILTROS,
  ORDENES,
  fechaLegible,
  hrefPersonas,
  paginasDe,
  planLegible,
  type ConsultaPersonas,
  type ListaPersonas,
} from "@/lib/admin/personas";

function Marca({ si, texto }: { si: boolean; texto: string }) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-2 text-xs font-bold ${si ? "bg-pino-suave text-pino" : "bg-papel-hundido text-pizarra"}`}>
      {texto}
    </span>
  );
}

export function ListaPersonasVista({ consulta, datos }: { consulta: ConsultaPersonas; datos: ListaPersonas | null }) {
  const paginas = datos ? paginasDe(datos.total) : 1;
  const desde = datos && datos.total > 0 ? consulta.offset + 1 : 0;
  const hasta = datos ? Math.min(consulta.offset + datos.filas.length, datos.total) : 0;

  return (
    <MarcoAdmin activo="personas">
      <p className="antetitulo mt-8">Personas</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Quién estudia</h1>

      <form action="/admin/usuarios" className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="q">
          Buscar por correo
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={consulta.busqueda}
          placeholder="Busca por correo"
          className="min-h-12 flex-1 rounded-xl border-2 border-filete bg-superficie px-4"
        />
        {consulta.filtro !== "todos" && <input type="hidden" name="filtro" value={consulta.filtro} />}
        {consulta.orden !== "registro" && <input type="hidden" name="orden" value={consulta.orden} />}
        <button type="submit" className="min-h-12 rounded-xl bg-pino px-5 font-bold text-sobre-pino">
          Buscar
        </button>
      </form>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map((f) => (
          <Link
            key={f.id}
            href={hrefPersonas(consulta, { filtro: f.id, pagina: 1 })}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-bold ${consulta.filtro === f.id ? "bg-pino text-sobre-pino" : "border-2 border-filete bg-superficie text-pizarra"}`}
          >
            {f.texto}
          </Link>
        ))}
      </div>

      <form action="/admin/usuarios" className="mt-4 flex items-center gap-2">
        {consulta.busqueda && <input type="hidden" name="q" value={consulta.busqueda} />}
        {consulta.filtro !== "todos" && <input type="hidden" name="filtro" value={consulta.filtro} />}
        <label htmlFor="orden" className="text-sm font-semibold text-pizarra">
          Orden
        </label>
        <select
          id="orden"
          name="orden"
          defaultValue={consulta.orden}
          className="min-h-11 rounded-xl border-2 border-filete bg-superficie px-3 text-sm font-semibold"
        >
          {ORDENES.map((o) => (
            <option key={o.id} value={o.id}>
              {o.texto}
            </option>
          ))}
        </select>
        <button type="submit" className="min-h-11 rounded-xl border-2 border-filete px-3 text-sm font-bold">
          Aplicar
        </button>
      </form>

      {!datos ? (
        <p className="mt-8 text-pizarra">No se ha podido leer el listado. Revisa la clave de servicio y la migración del CRM.</p>
      ) : datos.filas.length === 0 ? (
        <p className="mt-8 text-pizarra">Nadie encaja en esta lista.</p>
      ) : (
        <>
          <p className="mt-6 text-sm font-semibold text-pizarra">
            <span className="cifras">
              {desde}–{hasta}
            </span>{" "}
            de <span className="cifras">{datos.total}</span>
          </p>

          <ul className="mt-3 flex flex-col gap-3 md:hidden">
            {datos.filas.map((f) => (
              <li key={f.id}>
                <Link href={`/admin/usuarios/${f.id}`} className="block rounded-2xl border-2 border-filete bg-superficie p-4">
                  <p className="font-bold">{f.email ?? "Sin correo"}</p>
                  <p className="mt-1 text-sm text-pizarra">
                    {planLegible(f.plan, f.estado)} · <span className="cifras">{f.tests}</span> tests · <span className="cifras">{f.xp}</span> XP
                  </p>
                  <p className="mt-1 text-sm text-pizarra">Último acceso {fechaLegible(f.ultimo_acceso, true)}</p>
                  <p className="mt-3 flex flex-wrap gap-1.5">
                    <Marca si={f.hizo_test} texto="Test" />
                    <Marca si={f.limite} texto="Límite" />
                    <Marca si={f.precios || f.checkout} texto="Precios" />
                    <Marca si={f.pago} texto="Pago" />
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-3 hidden overflow-hidden rounded-2xl border-2 border-filete bg-superficie md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold tracking-wide text-pizarra uppercase">
                    {["Correo", "Registro", "Último acceso", "Tests", "Plan", "Racha", "XP", "Embudo"].map((c) => (
                      <th key={c} className="px-4 py-3 font-bold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.filas.map((f) => (
                    <tr key={f.id} className="border-t border-filete">
                      <td className="px-4 py-3 font-semibold">
                        <Link href={`/admin/usuarios/${f.id}`} className="enlace">
                          {f.email ?? "Sin correo"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{fechaLegible(f.registro)}</td>
                      <td className="px-4 py-3">{fechaLegible(f.ultimo_acceso, true)}</td>
                      <td className="cifras px-4 py-3">{f.tests}</td>
                      <td className="px-4 py-3">{planLegible(f.plan, f.estado)}</td>
                      <td className="cifras px-4 py-3">{f.racha}</td>
                      <td className="cifras px-4 py-3">{f.xp}</td>
                      <td className="px-4 py-3">
                        <span className="flex flex-wrap gap-1">
                          <Marca si={f.hizo_test} texto="Test" />
                          <Marca si={f.limite} texto="Límite" />
                          <Marca si={f.pago} texto="Pago" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {paginas > 1 && (
            <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-3">
              {consulta.pagina > 1 ? (
                <Link href={hrefPersonas(consulta, { pagina: consulta.pagina - 1 })} className="min-h-11 inline-flex items-center font-bold">
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              <p className="cifras text-sm font-semibold text-pizarra">
                {consulta.pagina} / {paginas}
              </p>
              {consulta.pagina < paginas ? (
                <Link href={hrefPersonas(consulta, { pagina: consulta.pagina + 1 })} className="min-h-11 inline-flex items-center font-bold">
                  Siguiente
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </MarcoAdmin>
  );
}
