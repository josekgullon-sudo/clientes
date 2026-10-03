import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Boton } from "@/components/boton";
import { oposicionActual, progresoPorTema, usuarioActual } from "@/lib/datos/usuario";
import { crearTest } from "../../acciones";

export const metadata: Metadata = { title: "Nuevo test" };

const errores: Record<string, string> = {
  "sin-preguntas": "No hay preguntas para lo que has elegido. Prueba con otros temas.",
  general: "No hemos podido preparar el test. Vuelve a intentarlo.",
};

export default async function NuevoTest({ searchParams }: PageProps<"/app/nuevo">) {
  const { suscrito } = await usuarioActual();
  if (!suscrito) redirect("/suscripcion");
  const q = await searchParams;
  const [opo, progreso] = await Promise.all([oposicionActual(), progresoPorTema()]);
  const totales = new Map(progreso.map((t) => [t.tema_id, t.total]));
  const bloques = [...new Set(opo.temas.map((t) => t.bloque))];
  const error = typeof q.error === "string" ? errores[q.error] : undefined;

  return (
    <form action={crearTest} className="flex flex-col gap-8 pb-24">
      <input type="hidden" name="modo" value="mixto" />
      <div>
        <h1 className="font-serif text-[2rem] leading-tight font-semibold">Nuevo test</h1>
        <p className="mt-2 font-serif text-[1.125rem]">
          Elige uno o varios temas. Si no eliges ninguno, mezclamos todo el temario.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-teja bg-teja-suave p-3">
          {error}
        </p>
      )}

      <fieldset>
        <legend className="font-semibold">Número de preguntas</legend>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[10, 20, 30, 50].map((n) => (
            <label
              key={n}
              className="flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-filete has-checked:border-tinta has-checked:bg-tinta has-checked:text-papel has-focus-visible:outline-3 has-focus-visible:outline-tinta"
            >
              <input type="radio" name="num" value={n} defaultChecked={n === 20} className="sr-only" />
              {n}
            </label>
          ))}
        </div>
      </fieldset>

      {bloques.map((b) => (
        <fieldset key={b}>
          <legend className="font-semibold">Bloque {b}</legend>
          <div className="mt-2 flex flex-col">
            {opo.temas
              .filter((t) => t.bloque === b)
              .map((t) => {
                const total = totales.get(t.id) ?? 0;
                return (
                  <label
                    key={t.id}
                    className={`flex min-h-12 items-start gap-3 border-b border-filete py-3 ${total ? "cursor-pointer" : "text-pizarra"}`}
                  >
                    <input
                      type="checkbox"
                      name="tema"
                      value={t.id}
                      disabled={!total}
                      className="mt-1 size-5 shrink-0 accent-[var(--tinta)]"
                    />
                    <span className="flex-1">
                      <span className="font-semibold">{t.numero}.</span> {t.titulo}
                    </span>
                    <span className="shrink-0 text-[0.9rem] text-pizarra">{total || "—"}</span>
                  </label>
                );
              })}
          </div>
        </fieldset>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-filete bg-papel pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Boton type="submit" ancho>
            Empezar test
          </Boton>
        </div>
      </div>
    </form>
  );
}
