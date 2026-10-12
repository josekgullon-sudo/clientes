import { Crown, Lock } from "lucide-react";
import { Boton, EnlaceBoton } from "@/components/boton";
import { crearTest } from "@/app/app/acciones";
import {
  minutosDeLeccion,
  nivelVisible,
  preguntasDeLeccion,
  siguienteLeccion,
  type NodoCamino,
} from "@/lib/estudio/camino";

type Estado = "actual" | "hecho" | "corona" | "cerrado" | "vacio" | "pendiente";

function estadoDe(t: NodoCamino, actualId: string | undefined, premium: boolean): Estado {
  if (t.total === 0) return "vacio";
  if (t.corona) return "corona";
  if (t.tema_id === actualId) return "actual";
  if (!premium && nivelVisible(t) >= 3) return "cerrado";
  if (t.lecciones > 0) return "hecho";
  return "pendiente";
}

export function Niveles({ nodo }: { nodo: NodoCamino }) {
  const nivel = nivelVisible(nodo);
  return (
    <span className="niveles" role="img" aria-label={nodo.corona ? "Tema completado" : `Nivel ${nivel} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} data-hecho={!!nodo.corona || n < nivel} data-actual={!nodo.corona && n === nivel} />
      ))}
    </span>
  );
}

/** Botones para empezar la lección de un tema. */
export function AccionesLeccion({ nodo, premium }: { nodo: NodoCamino; premium: boolean }) {
  const nivel = nivelVisible(nodo);
  const preguntas = preguntasDeLeccion(nodo);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <form action={crearTest} className="sm:flex-1">
        <input type="hidden" name="modo" value="leccion" />
        <input type="hidden" name="tema" value={nodo.tema_id} />
        <input type="hidden" name="num" value={String(preguntas)} />
        <Boton ancho>
          {nivel >= 5 ? "Hacer el examen del tema" : "Empezar lección"}
        </Boton>
      </form>
      {nivel < 5 && (
        <form action={crearTest}>
          <input type="hidden" name="modo" value="leccion" />
          <input type="hidden" name="tema" value={nodo.tema_id} />
          <input type="hidden" name="num" value="5" />
          <Boton variante="secundario" ancho>
            Solo 5 · {minutosDeLeccion(5)} min
          </Boton>
        </form>
      )}
      {premium && nivel < 3 && (
        <form action={crearTest}>
          <input type="hidden" name="modo" value="salto" />
          <input type="hidden" name="tema" value={nodo.tema_id} />
          <Boton variante="texto" ancho>
            Saltar al nivel 3
          </Boton>
        </form>
      )}
    </div>
  );
}

/** Camino de temas: raíl vertical, un paso por tema, la lección actual desplegada. */
export function Camino({
  temas,
  premium,
  puedeLeccion,
}: {
  temas: NodoCamino[];
  premium: boolean;
  puedeLeccion: boolean;
}) {
  const actual = siguienteLeccion(temas, premium);
  const bloques = [...new Set(temas.map((t) => t.bloque))];

  return (
    <div className="flex flex-col gap-8">
      {bloques.map((bloque) => {
        const delBloque = temas.filter((t) => t.bloque === bloque);
        const conPreguntas = delBloque.filter((t) => t.total > 0);
        const coronas = conPreguntas.filter((t) => t.corona).length;
        return (
          <section key={bloque} aria-labelledby={`camino-${bloque}`}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 id={`camino-${bloque}`} className="antetitulo">
                Bloque {bloque}
              </h2>
              <p className="cifras text-sm text-pizarra">
                {conPreguntas.length ? `${coronas} de ${conPreguntas.length} temas completados` : "En preparación"}
              </p>
            </div>
            <ol className="camino">
              {delBloque.map((t) => {
                const estado = estadoDe(t, actual?.tema_id, premium);
                const preguntas = preguntasDeLeccion(t);
                return (
                  <li key={t.tema_id} className="camino-paso" data-estado={estado} aria-current={estado === "actual" ? "step" : undefined}>
                    <span className="camino-nodo" aria-hidden="true">
                      {estado === "corona" ? (
                        <Crown size={18} strokeWidth={2.4} />
                      ) : estado === "cerrado" ? (
                        <Lock size={16} strokeWidth={2.4} />
                      ) : (
                        t.numero
                      )}
                    </span>
                    {estado === "actual" ? (
                      <div className="tarjeta -mt-1 flex-1 border-pino/40 p-4">
                        <p className="antetitulo">Siguiente lección · Tema {t.numero}</p>
                        <h3 className="mt-1 line-clamp-3 text-[1.0625rem] leading-snug font-bold" title={t.titulo}>
                          {t.titulo}
                        </h3>
                        <div className="mt-2 flex items-center gap-3">
                          <Niveles nodo={t} />
                          <span className="cifras text-sm text-pizarra">
                            Nivel {nivelVisible(t)} · {preguntas} preguntas · {minutosDeLeccion(preguntas)} min
                          </span>
                        </div>
                        {puedeLeccion ? (
                          <div className="mt-4">
                            <AccionesLeccion nodo={t} premium={premium} />
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-pizarra">Has usado las preguntas gratis de hoy. Mañana sigues aquí.</p>
                        )}
                      </div>
                    ) : (
                      <div className={`min-w-0 flex-1 pt-1.5 ${estado === "vacio" ? "text-pizarra" : ""}`}>
                        <p className={`line-clamp-2 leading-snug ${estado === "vacio" ? "text-[0.95rem]" : "font-semibold"}`} title={t.titulo}>
                          <span className="sr-only">Tema {t.numero}. </span>
                          {t.titulo}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {estado === "vacio" ? (
                            <span className="text-sm">En preparación</span>
                          ) : (
                            <>
                              <Niveles nodo={t} />
                              {estado === "corona" && <span className="text-sm font-semibold text-oro-texto">Completado</span>}
                              {estado === "cerrado" && (
                                <EnlaceBoton href="/suscripcion?motivo=nivel" variante="texto" className="!min-h-0 !px-0 text-sm">
                                  Nivel 3 con Premium
                                </EnlaceBoton>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
