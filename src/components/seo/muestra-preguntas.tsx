import { ChevronDown } from "lucide-react";
import { Cita } from "@/components/cita";
import { LETRAS, type PreguntaTest } from "@/lib/test/tipos";

/** Diez preguntas de muestra. La respuesta y el artículo están en el HTML y se abren al pulsar. */
export function MuestraPreguntas({ preguntas }: { preguntas: PreguntaTest[] }) {
  return (
    <ol className="mt-4 flex flex-col gap-3">
      {preguntas.map((p, i) => (
        <li key={p.id}>
          <details className="group rounded-2xl border-2 border-filete bg-superficie open:bg-papel">
            <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden">
              <span className="cifras grid size-8 shrink-0 place-items-center rounded-full bg-pino-suave text-sm font-extrabold text-pino">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block leading-snug font-semibold">{p.enunciado}</span>
                <span className="mt-1 block text-sm font-semibold text-pizarra">Art. {p.articulo}</span>
              </span>
              <ChevronDown aria-hidden size={18} className="mt-1 shrink-0 text-pizarra transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-filete px-4 py-4">
              <p className="text-sm font-bold text-pizarra">La correcta es la {LETRAS[p.correcta]}.</p>
              <ul className="mt-3 flex flex-col gap-2">
                {p.opciones.map((opcion, indice) => {
                  const correcta = indice === p.correcta;
                  return (
                    <li
                      key={opcion}
                      className={`rounded-xl border px-3 py-2 text-sm leading-snug ${
                        correcta ? "border-pino bg-pino-suave font-semibold" : "border-filete"
                      }`}
                    >
                      <span className="cifras mr-2 font-extrabold text-pizarra">{LETRAS[indice]}</span>
                      {opcion}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 font-serif text-[1.0625rem] leading-relaxed">{p.explicacion}</p>
              <p className="mt-3">
                <Cita articulo={p.articulo} ley={p.ley ?? "Documentación oficial"} />
              </p>
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}
