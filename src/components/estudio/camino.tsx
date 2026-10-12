import { Lock, Star } from "lucide-react";
import { Boton, EnlaceBoton } from "@/components/boton";
import { crearTest } from "@/app/app/acciones";
import { nivelVisible, preguntasDeLeccion, siguienteLeccion, type NodoCamino } from "@/lib/estudio/camino";

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
    <div className="flex flex-col gap-12">
      {bloques.map((bloque) => (
        <section key={bloque} aria-labelledby={`camino-${bloque}`}>
          <h2 id={`camino-${bloque}`} className="mb-4 text-center text-sm font-semibold tracking-wide text-pizarra uppercase">
            Bloque {bloque}
          </h2>
          <ol className="sendero">
            {temas
              .filter((t) => t.bloque === bloque)
              .map((t, i) => {
                const nivel = nivelVisible(t);
                const esActual = actual?.tema_id === t.tema_id;
                const bloqueado = !premium && t.total > 0 && !t.corona && nivel >= 3;
                const preguntas = preguntasDeLeccion(t);
                const lado = i % 3 === 1 ? "-2.25rem" : i % 3 === 2 ? "2.25rem" : "0";
                return (
                  <li key={t.tema_id} className="sendero-nodo" style={{ transform: `translateX(${lado})` }} aria-current={esActual ? "step" : undefined}>
                    <span
                      className={`nodo-circulo ${esActual ? "nodo-actual" : ""} ${t.corona ? "nodo-corona" : ""} ${t.total === 0 ? "nodo-vacio" : ""} ${bloqueado ? "nodo-cerrado" : ""}`}
                      aria-hidden
                    >
                      {t.total === 0 ? "·" : t.corona ? <Star size={22} /> : bloqueado ? <Lock size={18} /> : t.numero}
                    </span>
                    <p className="mt-2 max-w-[11rem] text-center text-sm leading-snug font-semibold">
                      {t.titulo}
                    </p>
                    {t.total === 0 ? (
                      <p className="text-xs text-pizarra">En preparación</p>
                    ) : (
                      <p className="mt-1 flex gap-1" aria-label={`Nivel ${t.corona ? 5 : nivel} de 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className={`camino-nivel ${n < nivel || t.corona ? "camino-nivel-hecho" : ""} ${n === nivel && !t.corona ? "camino-nivel-actual" : ""}`} />
                        ))}
                      </p>
                    )}
                    {esActual && puedeLeccion && t.total > 0 && (
                      <div className="mt-3 flex w-44 flex-col gap-2">
                        <form action={crearTest}>
                          <input type="hidden" name="modo" value="leccion" />
                          <input type="hidden" name="tema" value={t.tema_id} />
                          <input type="hidden" name="num" value={String(preguntas)} />
                          <Boton ancho>{nivel >= 5 ? "Examen" : "Continuar"}</Boton>
                        </form>
                        {nivel < 5 && (
                          <form action={crearTest}>
                            <input type="hidden" name="modo" value="leccion" />
                            <input type="hidden" name="tema" value={t.tema_id} />
                            <input type="hidden" name="num" value="5" />
                            <Boton variante="secundario" ancho>5 preguntas</Boton>
                          </form>
                        )}
                        {premium && nivel < 3 && (
                          <form action={crearTest}>
                            <input type="hidden" name="modo" value="salto" />
                            <input type="hidden" name="tema" value={t.tema_id} />
                            <Boton variante="texto" ancho>Saltar nivel</Boton>
                          </form>
                        )}
                      </div>
                    )}
                    {bloqueado && (
                      <div className="mt-2">
                        <EnlaceBoton href="/suscripcion?motivo=nivel" variante="texto">Premium</EnlaceBoton>
                      </div>
                    )}
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </div>
  );
}
