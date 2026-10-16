import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Boton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { NivelIntro } from "@/components/estudio/nivel-intro";
import { estadoNivel } from "@/lib/datos/retencion";
import { crearTest, omitirNivel } from "../acciones";

export const metadata: Metadata = { title: "Test de nivel", robots: { index: false } };

export default async function PaginaNivel() {
  const nivel = await estadoNivel();
  if (!nivel || nivel.hecho || nivel.omitido || !nivel.mostrar) {
    if (nivel?.abierto) redirect(`/app/test/${nivel.abierto}`);
    redirect("/app");
  }

  return (
    <>
      <Cabecera inicio="/app" derecha={null} />
      <main className="flex-1 pb-16">
        <NivelIntro
          acciones={
            <>
              <form action={crearTest}>
                <input type="hidden" name="modo" value="nivel" />
                <input type="hidden" name="num" value="10" />
                <Boton type="submit" ancho>
                  Empezar
                </Boton>
              </form>
              <form action={omitirNivel}>
                <Boton type="submit" variante="texto" ancho>
                  Saltar
                </Boton>
              </form>
            </>
          }
        />
      </main>
    </>
  );
}
