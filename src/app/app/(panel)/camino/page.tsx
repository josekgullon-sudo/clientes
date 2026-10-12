import type { Metadata } from "next";
import { Camino } from "@/components/estudio/camino";
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
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-[2rem] leading-tight font-semibold">Camino</h1>
        <p className="mt-1 text-pizarra">
          Cada tema tiene cinco niveles y un examen final. Al aprobarlo, el tema queda completado.
        </p>
        {conPreguntas.length > 0 && (
          <div className="mt-4">
            <div className="cifras flex justify-between text-sm font-semibold">
              <span>{coronas} de {conPreguntas.length} temas completados</span>
              <span className="text-pizarra">{Math.round((coronas / conPreguntas.length) * 100)} %</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-papel-hundido">
              <div className="h-full rounded-full bg-pino" style={{ width: `${(coronas / conPreguntas.length) * 100}%` }} />
            </div>
          </div>
        )}
      </header>
      {camino ? (
        <Camino temas={camino} premium={suscrito} puedeLeccion={puedeLeccion} />
      ) : (
        <p role="status" className="tarjeta p-4">El camino no está disponible ahora mismo. Vuelve a intentarlo en un rato.</p>
      )}
    </div>
  );
}
