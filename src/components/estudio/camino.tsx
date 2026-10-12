import { Boton, EnlaceBoton } from "@/components/boton";
import { crearTest } from "@/app/app/acciones";
import { minutosDeLeccion, nivelVisible, preguntasDeLeccion, siguienteLeccion, type NodoCamino } from "@/lib/estudio/camino";

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
      {bloques.map((bloque) => (
        <section key={bloque} aria-labelledby={`camino-${bloque}`}>
          <h2 id={`camino-${bloque}`} className="text-[0.95rem] font-semibold tracking-wide text-pizarra uppercase">
            Bloque {bloque}
          </h2>
          <ol className="camino mt-3">
            {temas
              .filter((t) => t.bloque === bloque)
              .map((t) => {
                const nivel = nivelVisible(t);
                const esActual = actual?.tema_id === t.tema_id;
                const bloqueado = !premium && t.total > 0 && !t.corona && nivel >= 3;
                const preguntas = preguntasDeLeccion(t);
                return (
                  <li key={t.tema_id} className={`camino-nodo ${esActual ? "camino-actual" : ""} ${t.corona ? "camino-corona" : ""}`}>
                    <div className="camino-marca" aria-hidden="true">
                      {t.total === 0 ? "·" : t.corona === "oro" ? "★" : t.corona === "plata" ? "✦" : t.numero}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        Tema {t.numero}. <span className="font-medium">{t.titulo}</span>
                      </p>
                      {t.total === 0 ? (
                        <p className="text-[0.95rem] text-pizarra">En preparación</p>
                      ) : (
                        <>
                          <p className="mt-1 flex gap-1" aria-label={`Nivel ${nivel} de 5`}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <span key={n} className={`camino-nivel ${n < nivel || t.corona ? "camino-nivel-hecho" : ""} ${n === nivel && !t.corona ? "camino-nivel-actual" : ""}`} />
                            ))}
                          </p>
                          {t.corona && (
                            <p className="mt-1 text-[0.95rem] text-pino">Corona de {t.corona}</p>
                          )}
                          {esActual && puedeLeccion && (
                            <div className="mt-3 flex flex-col gap-2">
                              <form action={crearTest}>
                                <input type="hidden" name="modo" value="leccion" />
                                <input type="hidden" name="tema" value={t.tema_id} />
                                <input type="hidden" name="num" value={String(preguntas)} />
                                <Boton ancho>
                                  {nivel >= 5 ? "Examen del tema" : "Continuar"} · {preguntas} preguntas · {minutosDeLeccion(preguntas)} min
                                </Boton>
                              </form>
                              {nivel < 5 && (
                                <form action={crearTest}>
                                  <input type="hidden" name="modo" value="leccion" />
                                  <input type="hidden" name="tema" value={t.tema_id} />
                                  <input type="hidden" name="num" value="5" />
                                  <Boton variante="secundario" ancho>Exprés · 5 preguntas · 3 min</Boton>
                                </form>
                              )}
                              {premium && nivel < 3 && (
                                <form action={crearTest}>
                                  <input type="hidden" name="modo" value="salto" />
                                  <input type="hidden" name="tema" value={t.tema_id} />
                                  <Boton variante="texto" ancho>¿Ya lo sabes? 15 preguntas y saltas al nivel 3</Boton>
                                </form>
                              )}
                            </div>
                          )}
                          {bloqueado && (
                            <div className="mt-3">
                              <EnlaceBoton href="/suscripcion?motivo=nivel" variante="secundario">
                                Nivel {nivel} con Premium
                              </EnlaceBoton>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </div>
  );
}
