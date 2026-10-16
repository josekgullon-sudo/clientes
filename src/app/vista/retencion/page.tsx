import type { ReactNode } from "react";
import { Boton, EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { NivelIntro } from "@/components/estudio/nivel-intro";
import { TarjetaTestHoy } from "@/components/estudio/tarjeta-hoy";
import { Cierre } from "@/components/test/cierre";
import type { TemaNivel } from "@/lib/test/nivel";

const temas: TemaNivel[] = [
  { temaId: "t4", numero: 4, etiqueta: "Tema 4. El Gobierno", total: 3, aciertos: 1, porcentaje: 33 },
  { temaId: "t8", numero: 8, etiqueta: "Tema 8. El procedimiento", total: 4, aciertos: 2, porcentaje: 50 },
  { temaId: "t1", numero: 1, etiqueta: "Tema 1. La Constitución", total: 3, aciertos: 3, porcentaje: 100 },
];

function Marco({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className="mx-auto w-full max-w-md overflow-hidden rounded-[1.75rem] border-2 border-filete bg-papel shadow-[0_8px_0_var(--filete)]">
      {children}
    </div>
  );
}

/** Maqueta de las tres pantallas de retención, sin sesión. */
export default function VistaRetencion() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
      <Marco id="vista-nivel">
        <Cabecera inicio="/vista/retencion" derecha={null} />
        <NivelIntro
          acciones={
            <>
              <EnlaceBoton href="#vista-cierre" ancho>
                Empezar
              </EnlaceBoton>
              <EnlaceBoton href="#vista-hoy" variante="texto" ancho>
                Saltar
              </EnlaceBoton>
            </>
          }
        />
        <div className="h-8" />
      </Marco>

      <Marco id="vista-cierre">
        <Cabecera inicio="/vista/retencion" derecha={null} />
        <Cierre
          titulo="Test terminado"
          aciertos={7}
          total={10}
          xp={74}
          racha={3}
          temas={temas.slice(0, 2)}
          acciones={
            <>
              <Boton type="button" ancho>
                Repasar mis fallos ahora
              </Boton>
              <Boton type="button" variante="secundario" ancho>
                Siguiente test
              </Boton>
            </>
          }
        />
        <div className="h-6" />
      </Marco>

      <Marco id="vista-nivel-fin">
        <Cabecera inicio="/vista/retencion" derecha={null} />
        <Cierre
          titulo="Tu nivel"
          aciertos={6}
          total={10}
          xp={64}
          racha={1}
          temas={temas}
          porTema
          acciones={
            <>
              <Boton type="button" ancho>
                Empieza por el tema 4
              </Boton>
              <Boton type="button" variante="secundario" ancho>
                Repasar mis fallos ahora
              </Boton>
              <Boton type="button" variante="secundario" ancho>
                Siguiente test
              </Boton>
            </>
          }
        />
        <div className="h-6" />
      </Marco>

      <Marco id="vista-hoy">
        <div className="flex flex-col gap-4 p-4">
          <TarjetaTestHoy hecho={false} racha={3} accion={<Boton type="button" ancho>Hacerlo ahora</Boton>} />
          <TarjetaTestHoy hecho racha={4} accion={null} />
        </div>
      </Marco>
    </div>
  );
}
