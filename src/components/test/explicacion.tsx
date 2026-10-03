import { Cita } from "@/components/cita";
import { NotaMargen } from "@/components/nota-margen";
import { LETRAS, type PreguntaTest } from "@/lib/test/tipos";

/** Explicación de la respuesta como nota al margen, con la cita de la ley subrayada. */
export function Explicacion({
  pregunta,
  respuesta,
  titular = true,
}: {
  pregunta: PreguntaTest;
  respuesta: number | null | undefined;
  titular?: boolean;
}) {
  const acierto = respuesta === pregunta.correcta;
  const letra = LETRAS[pregunta.correcta];
  const tono = respuesta === null || respuesta === undefined ? "neutro" : acierto ? "acierto" : "fallo";

  return (
    <NotaMargen tono={tono}>
      {titular && (
        <p className="mb-1 font-sans font-semibold">
          {acierto ? `Bien. Es la ${letra}.` : `La correcta es la ${letra}.`}
        </p>
      )}
      <p>{pregunta.explicacion}</p>
      <p className="mt-2">
        <Cita articulo={pregunta.articulo} ley={pregunta.ley ?? "Documentación oficial"} />
      </p>
    </NotaMargen>
  );
}
