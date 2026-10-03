import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { ListaCorreccion } from "@/components/test/lista-correccion";
import { Resumen } from "@/components/test/resumen";
import { SesionTest } from "@/components/test/sesion-test";
import { intentoConPreguntas } from "@/lib/datos/usuario";
import { temasAMejorar } from "@/lib/test/tipos";
import { terminarTest } from "../../acciones";

export const metadata: Metadata = { title: "Test" };

export default async function PaginaTest({ params }: PageProps<"/app/test/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const datos = await intentoConPreguntas(id);
  if (!datos) notFound();
  const { intento, preguntas, respuestas } = datos;

  if (!intento.terminado_en) {
    if (preguntas.length === 0) notFound();
    return (
      <SesionTest
        preguntas={preguntas}
        modo={intento.modo === "simulacro" ? "examen" : "estudio"}
        minutos={intento.minutos}
        inicio={intento.creado_en}
        salirA="/app"
        alTerminar={terminarTest.bind(null, id)}
      />
    );
  }

  const mapa = new Map(Object.entries(respuestas));
  const estados = preguntas.map((p) => {
    const r = respuestas[p.id] ?? null;
    return r === null ? ("pendiente" as const) : r === p.correcta ? ("acierto" as const) : ("fallo" as const);
  });

  return (
    <>
      <Cabecera />
      <main className="flex-1">
        <Resumen
          resultado={{
            total: intento.preguntas.length,
            aciertos: intento.aciertos ?? 0,
            fallos: intento.fallos ?? 0,
            enBlanco: intento.en_blanco ?? 0,
            nota: Number(intento.puntuacion ?? 0),
          }}
          penalizacion={intento.modo === "simulacro" ? Number(intento.penalizacion) : 0}
          estados={estados}
          temas={temasAMejorar(preguntas, mapa)}
          acciones={
            <>
              <EnlaceBoton href="/app/nuevo" ancho>
                Hacer otro test
              </EnlaceBoton>
              <EnlaceBoton href="/app" variante="secundario" ancho>
                Volver al panel
              </EnlaceBoton>
            </>
          }
        />
        <ListaCorreccion preguntas={preguntas} respuestas={respuestas} />
      </main>
    </>
  );
}
