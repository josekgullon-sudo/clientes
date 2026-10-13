import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Boton } from "@/components/boton";
import { oposicionActual, progresoPorTema, usuarioActual } from "@/lib/datos/usuario";
import { crearTest } from "../../acciones";

export const metadata: Metadata = { title: "Test a medida" };

const errores: Record<string, string> = {
  "sin-preguntas": "No hay preguntas para lo que has elegido. Prueba con otros temas.",
  general: "No hemos podido preparar el test. Vuelve a intentarlo.",
};

export default async function NuevoTest({ searchParams }: PageProps<"/app/nuevo">) {
  const { suscrito } = await usuarioActual();
  if (!suscrito) redirect("/suscripcion?motivo=personalizado");
  const q = await searchParams;
  const [opo, progreso] = await Promise.all([oposicionActual(), progresoPorTema()]);
  const totales = new Map(progreso.map((t) => [t.tema_id, t.total]));
  const bloques = [...new Set(opo.temas.map((t) => t.bloque))];
  const error = typeof q.error === "string" ? errores[q.error] : undefined;

  return (
    <form action={crearTest} className="flex flex-col gap-6 pb-20">
      <input type="hidden" name="modo" value="mixto" />
      <header>
        <h1 className="font-display text-[2rem] leading-tight font-extrabold">Test a medida</h1>
        <p className="mt-2 text-pizarra">Elige uno o varios temas. Si no eliges ninguno, mezclamos todo el temario.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-teja bg-teja-suave p-3">
          {error}
        </p>
      )}

      <fieldset className="tarjeta p-5">
        <legend className="sr-only">Número de preguntas</legend>
        <p className="font-bold" aria-hidden="true">
          Número de preguntas
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[5, 10, 20, 30].map((n) => (
            <label
              key={n}
              className="cifras flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-filete bg-papel text-lg font-extrabold transition has-checked:border-pino has-checked:bg-pino-suave has-checked:text-pino has-focus-visible:outline-3 has-focus-visible:outline-tinta"
            >
              <input type="radio" name="num" value={n} defaultChecked={n === 10} className="sr-only" />
              {n}
            </label>
          ))}
        </div>
      </fieldset>

      {bloques.map((b) => (
        <fieldset key={b} className="tarjeta overflow-hidden">
          <legend className="sr-only">Bloque {b}</legend>
          <p className="antetitulo px-5 pt-4" aria-hidden="true">
            Bloque {b}
          </p>
          <div className="mt-2 flex flex-col divide-y divide-filete">
            {opo.temas
              .filter((t) => t.bloque === b)
              .map((t) => {
                const total = totales.get(t.id) ?? 0;
                return (
                  <label
                    key={t.id}
                    className={`flex min-h-14 items-center gap-3 px-5 py-3 transition has-checked:bg-pino-suave/60 ${total ? "cursor-pointer" : "text-pizarra opacity-60"}`}
                  >
                    <input
                      type="checkbox"
                      name="tema"
                      value={t.id}
                      disabled={!total}
                      className="size-5 shrink-0 accent-[var(--pino-boton)]"
                    />
                    <span className="flex-1 leading-snug">
                      <span className="font-bold">{t.numero}.</span> {t.titulo}
                    </span>
                    <span className="cifras shrink-0 text-sm text-pizarra">{total || "Pronto"}</span>
                  </label>
                );
              })}
          </div>
        </fieldset>
      ))}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-filete bg-superficie/95 backdrop-blur-md md:bottom-0">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Boton type="submit" ancho>
            Empezar test
          </Boton>
        </div>
      </div>
    </form>
  );
}
