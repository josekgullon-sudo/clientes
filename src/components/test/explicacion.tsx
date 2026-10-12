import { BookOpen } from "lucide-react";
import { Cita } from "@/components/cita";
import { LETRAS, type PreguntaTest } from "@/lib/test/tipos";

/** Explicación de la respuesta: por qué es la correcta y el artículo exacto, subrayado. */
export function Explicacion({
  pregunta,
  respuesta,
  titular = true,
  plana = false,
}: {
  pregunta: PreguntaTest;
  respuesta: number | null | undefined;
  /** Muestra «Bien. Es la B» o «La correcta es la B» encima. */
  titular?: boolean;
  /** Sin tarjeta, para meterla dentro de otra. */
  plana?: boolean;
}) {
  const acierto = respuesta === pregunta.correcta;
  const letra = LETRAS[pregunta.correcta];
  const tono =
    respuesta === null || respuesta === undefined ? "border-pizarra/40" : acierto ? "border-pino" : "border-teja";

  return (
    <div className={plana ? "" : "tarjeta p-5"}>
      <p className="flex items-center gap-2 text-sm font-bold text-pizarra">
        <BookOpen aria-hidden size={16} />
        {titular ? (acierto ? `Bien. Es la ${letra}.` : `La correcta es la ${letra}.`) : "Por qué"}
      </p>
      <div className={`mt-3 border-l-[3px] ${tono} pl-4 font-serif text-[1.0625rem] leading-relaxed`}>
        <p>{pregunta.explicacion}</p>
      </div>
      <p className="mt-4">
        <Cita articulo={pregunta.articulo} ley={pregunta.ley ?? "Documentación oficial"} />
      </p>
    </div>
  );
}
