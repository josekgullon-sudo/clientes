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
  const ahorro = Math.round((1 - PRECIOS.anual / (PRECIOS.mensual * 12)) * 100);
  return (
    <div className="grid items-stretch gap-5 md:grid-cols-2">
      <article className="tarjeta flex flex-col p-7">
        <h3 className="font-display text-xl font-black">Gratis</h3>
        <p className="mt-1 text-sm text-pizarra">Para empezar y crear el hábito.</p>
        <p className="mt-5 font-display text-5xl font-extrabold">0 €</p>
        <p className="mt-1 text-sm text-pizarra">Para siempre</p>
        <div className="mt-6 flex-1">
          <Checks puntos={PUNTOS_GRATIS} />
        </div>
        {mostrarBotones && (
          <div className="mt-7">
            <EnlaceBoton href={ctaGratis} variante="secundario" ancho>
              Empezar gratis
            </EnlaceBoton>
          </div>
        )}
      </article>
      <article className="relative flex flex-col rounded-[1.25rem] border-2 border-[#a78bfa] bg-superficie p-7 shadow-[0_4px_0_#a78bfa]">
        <p className="absolute -top-3.5 left-7 rounded-full bg-subrayador px-3 py-1 text-xs font-extrabold text-subrayador-texto">
          Ahorras un {ahorro} %
        </p>
        <h3 className="font-display text-xl font-black text-morado-texto">Premium anual</h3>
        <p className="mt-1 text-sm text-pizarra">Para ir a por la plaza.</p>
        <p className="mt-5 font-display text-5xl font-extrabold">
          {eur.format(precioMesEquivalente)}
          <span className="font-sans text-base font-semibold text-pizarra"> /mes</span>
        </p>
        <p className="cifras mt-1 text-sm text-pizarra">
          {eur.format(PRECIOS.anual)} al año · o {eur.format(PRECIOS.mensual)} mes a mes
        </p>
        <div className="mt-6 flex-1">
          <Checks puntos={PUNTOS_PREMIUM} />
        </div>
        {mostrarBotones && (
          <div className="mt-7">
            <EnlaceBoton href={ctaPremium} variante="premium" ancho>
              Elegir Premium
            </EnlaceBoton>
          </div>
        )}
      </article>
    </div>
  );
}
