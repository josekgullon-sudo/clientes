import type { Metadata } from "next";
import { CaminoJuego } from "@/components/estudio/camino-juego";
import { ClaraDice } from "@/components/mascota/bocadillo";
import { caminoTemas } from "@/lib/datos/estudio";
import { cuotaRestante, usuarioActual } from "@/lib/datos/usuario";

export const metadata: Metadata = { title: "Camino" };

export default async function PaginaCamino() {
  const { suscrito } = await usuarioActual();
  const [camino, cuota] = await Promise.all([caminoTemas(), cuotaRestante()]);
  const puedeLeccion = suscrito || !cuota || cuota.tema > 0;
  const conPreguntas = camino?.filter((t) => t.total > 0) ?? [];
  const coronas = conPreguntas.filter((t) => t.corona).length;

  return (
    <div className="flex flex-col gap-8">
      <ClaraDice pose="senala">
        <span className="block font-display text-lg font-black">Tu camino al aprobado</span>
        <span className="font-semibold">
          Cada tema tiene 5 niveles y un examen final. Supéralo y ganas su corona.
          {conPreguntas.length > 0 && ` Llevas ${coronas} de ${conPreguntas.length}.`}
        </span>
      </ClaraDice>
      {camino ? (
        <CaminoJuego temas={camino} premium={suscrito} puedeLeccion={puedeLeccion} />
      ) : (
        <p role="status" className="tarjeta p-4">
          El camino no está disponible ahora mismo. Vuelve a intentarlo en un rato.
        </p>
      )}
    </div>
  );
}
