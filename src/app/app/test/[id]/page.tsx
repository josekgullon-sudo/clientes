import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Boton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { Cierre } from "@/components/test/cierre";
import { ListaCorreccion } from "@/components/test/lista-correccion";
import { SesionTest } from "@/components/test/sesion-test";
import { intentoConPreguntas } from "@/lib/datos/usuario";
import type { MetaSesion } from "@/lib/estudio/celebracion";
import { porcentajesPorTema, recomendarInicio } from "@/lib/test/nivel";
import { crearTest, siguienteTest, terminarTest } from "../../acciones";

export const metadata: Metadata = { title: "Test" };

export default async function PaginaTest({ params }: PageProps<"/app/test/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const datos = await intentoConPreguntas(id);
  if (!datos) notFound();
  const { intento, preguntas, respuestas } = datos;

  const examen =
    intento.modo === "simulacro" || (intento.modo === "leccion" && Number(intento.tema_nivel) === 5);

  if (!intento.terminado_en) {
    if (preguntas.length === 0) notFound();
    return (
      <SesionTest
        preguntas={preguntas}
        modo={examen ? "examen" : "estudio"}
        minutos={intento.minutos}
        inicio={intento.creado_en}
        salirA="/app"
        alTerminar={terminarTest.bind(null, id)}
      />
    );
  }

  const mapa = new Map(Object.entries(respuestas));
  const meta = intento.meta as MetaSesion | null;
  const esNivel = intento.modo === "nivel";
  const porTema = porcentajesPorTema(preguntas, mapa);
  const flojos = porTema.filter((tema) => tema.aciertos < tema.total).slice(0, 3);
  const recomendado = esNivel ? recomendarInicio(porTema) : null;
  const hayFallos = (intento.fallos ?? 0) > 0;
  const titulo =
    intento.modo === "simulacro"
      ? "Simulacro terminado"
      : esNivel
        ? "Tu nivel"
        : intento.modo === "hoy"
          ? "Test de hoy"
          : "Test terminado";

  return (
    <>
      <Cabecera inicio="/app" derecha={null} />
      <main className="flex-1 pb-16">
        <Cierre
          titulo={titulo}
          aciertos={intento.aciertos ?? 0}
          total={intento.preguntas.length}
          xp={meta?.xp ?? 0}
          racha={meta?.racha ?? 0}
          temas={esNivel ? porTema : flojos}
          porTema={esNivel}
          acciones={
            <>
              {recomendado?.temaId && (
                <form action={crearTest}>
                  <input type="hidden" name="modo" value="tema" />
                  <input type="hidden" name="tema" value={recomendado.temaId} />
                  <input type="hidden" name="num" value="10" />
                  <Boton type="submit" ancho>
                    Empieza por el tema {recomendado.numero}
                  </Boton>
                </form>
              )}
              {hayFallos && (
                <form action={crearTest}>
                  <input type="hidden" name="modo" value="repaso" />
                  <input type="hidden" name="num" value="10" />
                  <Boton type="submit" variante={recomendado ? "secundario" : "principal"} ancho>
                    Repasar mis fallos ahora
                  </Boton>
                </form>
              )}
              <form action={siguienteTest}>
                <input type="hidden" name="hoy" value={intento.modo === "hoy" ? "0" : "1"} />
                <input type="hidden" name="tema" value={flojos.find((tema) => tema.temaId)?.temaId ?? ""} />
                <Boton type="submit" variante={hayFallos || recomendado ? "secundario" : "principal"} ancho>
                  Siguiente test
                </Boton>
              </form>
            </>
          }
        />
        <ListaCorreccion preguntas={preguntas} respuestas={respuestas} puedeGuardar />
      </main>
    </>
  );
}
