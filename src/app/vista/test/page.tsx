import { SesionTest } from "@/components/test/sesion-test";
import { preguntasVista } from "../datos";

export default function VistaTest() {
  return (
    <SesionTest
      preguntas={preguntasVista}
      modo="estudio"
      salirA="/vista/panel"
    />
  );
}
