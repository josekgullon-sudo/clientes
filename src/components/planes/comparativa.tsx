import { EnlaceBoton } from "@/components/boton";
import { PRECIOS, eur, precioMesEquivalente } from "@/lib/sitio";
import { Checks, PUNTOS_GRATIS, PUNTOS_PREMIUM } from "./checks";

export function Comparativa({
  ctaGratis = "/demo",
  ctaPremium = "/suscripcion",
  mostrarBotones = true,
}: {
  ctaGratis?: string;
  ctaPremium?: string;
  mostrarBotones?: boolean;
}) {
  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2">
      <article className="tarjeta flex flex-col p-6">
        <h3 className="text-sm font-semibold tracking-wide text-pizarra uppercase">Gratis</h3>
        <p className="mt-2 font-serif text-4xl font-semibold">0 €</p>
        <Checks puntos={PUNTOS_GRATIS} />
        {mostrarBotones && (
          <div className="mt-6">
            <EnlaceBoton href={ctaGratis} variante="secundario" ancho>
              Probar
            </EnlaceBoton>
          </div>
        )}
      </article>
      <article className="tarjeta relative flex flex-col border-2 border-pino bg-pino-suave p-6">
        <p className="absolute -top-3 left-6 rounded-full bg-pino-boton px-3 py-1 text-xs font-semibold text-sobre-pino">Más elegido</p>
        <h3 className="text-sm font-semibold tracking-wide text-pino uppercase">Anual</h3>
        <p className="mt-2 font-serif text-4xl font-semibold">
          {eur.format(precioMesEquivalente)}
          <span className="font-sans text-base font-normal text-pizarra"> /mes</span>
        </p>
        <p className="mt-1 text-sm text-pizarra">{eur.format(PRECIOS.anual)} al año</p>
        <Checks puntos={PUNTOS_PREMIUM} />
        {mostrarBotones && (
          <div className="mt-6">
            <EnlaceBoton href={ctaPremium} ancho>
              Elegir anual
            </EnlaceBoton>
          </div>
        )}
      </article>
    </div>
  );
}
