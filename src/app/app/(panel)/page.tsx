import type { Metadata } from "next";
import Link from "next/link";
import { Boton, EnlaceBoton } from "@/components/boton";
import { falladasPendientes, progresoPorTema, rachaActual, ultimosIntentos, usuarioActual } from "@/lib/datos/usuario";
import { crearTest } from "../acciones";

export const metadata: Metadata = { title: "Tu panel" };

const nombresModo = { tema: "Test por tema", mixto: "Test mezclado", falladas: "Repaso de fallos", simulacro: "Simulacro" };
const fecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });

export default async function Panel() {
  const { suscrito } = await usuarioActual();
  const [progreso, racha, intentos, falladas] = await Promise.all([
    progresoPorTema(),
    rachaActual(),
    ultimosIntentos(),
    falladasPendientes(),
  ]);

  const flojos = progreso
    .filter((t) => t.vistas >= 5 && t.dominadas / t.vistas < 0.6)
    .sort((a, b) => a.dominadas / a.vistas - b.dominadas / b.vistas)
    .slice(0, 3);
  const bloques = [...new Set(progreso.map((t) => t.bloque))];

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="font-serif text-[2rem] leading-tight font-semibold">Tu estudio</h1>
        <p className="mt-2 font-serif text-[1.125rem]">
          {racha > 1 ? (
            <>
              Llevas <span className="subrayado font-semibold">{racha} días seguidos</span> estudiando.
            </>
          ) : racha === 1 ? (
            "Hoy ya has estudiado. Mañana sumas otro día."
          ) : (
            "Un test al día hace más que una tarde entera de vez en cuando."
          )}
        </p>
      </section>

      {!suscrito && (
        <section className="border-l-[3px] border-subrayador pl-4">
          <h2 className="font-serif text-xl font-semibold">Activa tu suscripción</h2>
          <p className="mt-1">Con ella haces test de todo el temario, repasas tus fallos y haces simulacros.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <EnlaceBoton href="/suscripcion">Ver planes</EnlaceBoton>
            <EnlaceBoton href="/demo" variante="secundario">
              Hacer el test de prueba
            </EnlaceBoton>
          </div>
        </section>
      )}

      {suscrito && (
        <section aria-label="Empezar" className="flex flex-col gap-2 sm:flex-row">
          <EnlaceBoton href="/app/nuevo" ancho>
            Empezar test
          </EnlaceBoton>
          <form action={crearTest} className="w-full">
            <input type="hidden" name="modo" value="falladas" />
            <input type="hidden" name="num" value="20" />
            <Boton variante="secundario" ancho disabled={falladas === 0}>
              Repasar fallos{falladas ? ` (${falladas})` : ""}
            </Boton>
          </form>
          <EnlaceBoton href="/app/simulacro" variante="secundario" ancho>
            Simulacro
          </EnlaceBoton>
        </section>
      )}

      {flojos.length > 0 && (
        <section aria-labelledby="flojos">
          <h2 id="flojos" className="font-serif text-xl font-semibold">
            Temas para reforzar
          </h2>
          <ul className="mt-2">
            {flojos.map((t) => (
              <li key={t.tema_id} className="flex items-center justify-between gap-4 border-b border-filete py-3">
                <span>
                  <span className="font-semibold">Tema {t.numero}.</span> {t.titulo}
                  <span className="block text-[0.95rem] text-pizarra">
                    Aciertas {Math.round((t.dominadas / t.vistas) * 100)} % de lo que has visto
                  </span>
                </span>
                {suscrito && (
                  <form action={crearTest}>
                    <input type="hidden" name="modo" value="tema" />
                    <input type="hidden" name="tema" value={t.tema_id} />
                    <input type="hidden" name="num" value="20" />
                    <button className="min-h-11 shrink-0 px-2 font-semibold underline underline-offset-4">Repasar</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="progreso">
        <h2 id="progreso" className="font-serif text-xl font-semibold">
          Progreso por tema
        </h2>
        <p className="mt-1 text-[0.95rem] text-pizarra">
          Dominadas: preguntas que acertaste la última vez que te salieron.
        </p>
        {bloques.map((b) => (
          <div key={b} className="mt-4">
            <h3 className="text-[0.95rem] font-semibold text-pizarra">Bloque {b}</h3>
            <ul>
              {progreso
                .filter((t) => t.bloque === b)
                .map((t) => {
                  const pct = t.total ? (t.dominadas / t.total) * 100 : 0;
                  return (
                    <li key={t.tema_id} className="border-b border-filete py-3">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="line-clamp-2">
                          <span className="font-semibold">{t.numero}.</span> {t.titulo}
                        </span>
                        <span className="shrink-0 text-[0.9rem] text-pizarra">
                          {t.total ? `${t.dominadas}/${t.total}` : "Sin preguntas"}
                        </span>
                      </div>
                      {t.total > 0 && (
                        <div
                          className="mt-2 h-1.5 bg-filete"
                          role="img"
                          aria-label={`${t.dominadas} de ${t.total} preguntas dominadas`}
                        >
                          <div className="h-full bg-pino" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>

      {intentos.length > 0 && (
        <section aria-labelledby="ultimos">
          <h2 id="ultimos" className="font-serif text-xl font-semibold">
            Últimos test
          </h2>
          <ul className="mt-2">
            {intentos.map((i) => (
              <li key={i.id} className="border-b border-filete">
                <Link href={`/app/test/${i.id}`} className="flex min-h-12 items-center justify-between gap-4 py-2 hover:underline">
                  <span>
                    {nombresModo[i.modo as keyof typeof nombresModo]}
                    <span className="block text-[0.9rem] text-pizarra">{fecha.format(new Date(i.creado_en))}</span>
                  </span>
                  <span className="shrink-0">
                    {i.aciertos}/{i.preguntas.length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
