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
  type FilaPersona,
  type ListaPersonas,
} from "@/lib/admin/personas";

const columnas = "md:grid-cols-[minmax(12rem,1.6fr)_repeat(5,minmax(0,1fr))]";

function Fila({ f }: { f: FilaPersona }) {
  return (
    <Link
      href={`/admin/usuarios/${f.id}`}
      className={`grid gap-1 rounded-2xl border-2 border-filete bg-superficie p-4 hover:border-pino md:items-center md:rounded-none md:border-0 md:border-t md:border-filete md:px-4 md:py-3 ${columnas}`}
    >
      <span className="font-bold break-all">{f.email ?? "Sin correo"}</span>
      <span>
        <span className="text-pizarra md:hidden">Registro </span>
        {fechaLegible(f.registro)}
      </span>
      <span>
        <span className="text-pizarra md:hidden">Último acceso </span>
        {fechaLegible(f.ultimo_acceso, true)}
      </span>
      <span>{planLegible(f.plan, f.estado)}</span>
      <span>
        <span className="cifras">{f.tests}</span>
        <span className="text-pizarra md:hidden"> tests</span>
      </span>
      <span>
        <span className="text-pizarra md:hidden">Racha </span>
        <span className="cifras">{f.racha}</span>
      </span>
    </Link>
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
        <a
          href={hrefPersonas(consulta).replace("/admin/usuarios", "/api/admin/exportar")}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-filete px-4 text-sm font-bold"
        >
          Descargar CSV
        </a>
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
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

      <form action="/admin/usuarios" className="mt-3 flex items-center gap-2">
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
        <p className="mt-8 text-pizarra">No se ha podido leer el listado. Revisa la clave de servicio.</p>
      ) : (
        <>
          <p className="mt-6 text-sm font-semibold text-pizarra">
            {datos.filas.length === 0 ? (
              "Nadie encaja en esta lista."
            ) : (
              <>
                <span className="cifras">
                  {desde}–{hasta}
                </span>{" "}
                de <span className="cifras">{datos.total}</span>
              </>
            )}
          </p>

          {datos.filas.length > 0 && (
            <div className="mt-3 md:overflow-hidden md:rounded-2xl md:border-2 md:border-filete md:bg-superficie">
              <div className={`hidden px-4 py-3 text-xs font-bold tracking-wide text-pizarra uppercase md:grid ${columnas}`}>
                <span>Correo</span>
                <span>Registro</span>
                <span>Último acceso</span>
                <span>Plan</span>
                <span>Tests</span>
                <span>Racha</span>
              </div>
              <ul className="flex flex-col gap-3 md:gap-0">
                {datos.filas.map((f) => (
                  <li key={f.id}>
                    <Fila f={f} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {paginas > 1 && (
            <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-3">
              {consulta.pagina > 1 ? (
                <Link href={hrefPersonas(consulta, { pagina: consulta.pagina - 1 })} className="inline-flex min-h-11 items-center font-bold">
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              <p className="cifras text-sm font-semibold text-pizarra">
                {consulta.pagina} / {paginas}
              </p>
              {consulta.pagina < paginas ? (
                <Link href={hrefPersonas(consulta, { pagina: consulta.pagina + 1 })} className="inline-flex min-h-11 items-center font-bold">
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
