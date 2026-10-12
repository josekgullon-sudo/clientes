import { EnlaceBoton } from "@/components/boton";
import { CUOTA_GRATIS, PRECIOS, eur, precioMesEquivalente } from "@/lib/sitio";

const filas = [
  { funcion: "Test de un tema", gratis: `${CUOTA_GRATIS} preguntas al día`, premium: "Sin límite y varios temas a la vez" },
  { funcion: "Repaso de tus fallos", gratis: `Hasta ${CUOTA_GRATIS} al día`, premium: "Sin límite" },
  { funcion: "Progreso por tema", gratis: "Sí", premium: "Sí, con estadísticas avanzadas" },
  { funcion: "Simulacro con el formato real", gratis: "1 de prueba", premium: "Ilimitados" },
  { funcion: "Test personalizado", gratis: "No", premium: "Varios temas y el número que elijas" },
];

export function Comparativa({
  ctaGratis = "/demo",
  ctaPremium = "/suscripcion",
  mostrarBotones = true,
}: {
  ctaGratis?: string;
  ctaPremium?: string;
  mostrarBotones?: boolean;
}) {
  const alDia = PRECIOS.anual / 365;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-filete bg-papel p-4">
          <h3 className="text-[0.95rem] font-semibold text-pizarra">Gratis</h3>
          <p className="mt-1 font-serif text-3xl font-semibold">0 €</p>
          <p className="mt-1 text-[0.95rem] text-pizarra">{CUOTA_GRATIS} preguntas al día y el repaso de esos fallos.</p>
        </article>
        <article className="rounded-xl border-2 border-pino bg-pino-suave p-4">
          <p className="text-[0.85rem] font-semibold tracking-wide text-pino uppercase">Más elegido</p>
          <h3 className="mt-1 font-semibold">Premium anual</h3>
          <p className="mt-1 font-serif text-3xl font-semibold">
            {eur.format(precioMesEquivalente)}
            <span className="font-sans text-base font-normal text-pizarra"> /mes</span>
          </p>
          <p className="mt-1 text-[0.95rem]">
            {eur.format(PRECIOS.anual)} al año · {eur.format(alDia)} al día. El mensual son {eur.format(PRECIOS.mensual)}.
          </p>
        </article>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-[0.95rem]">
          <caption className="sr-only">Qué incluye el plan gratis y el premium</caption>
          <thead>
            <tr className="border-b border-filete">
              <th scope="col" className="py-2 pr-3 font-semibold">Qué incluye</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Gratis</th>
              <th scope="col" className="py-2 font-semibold">Premium</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.funcion} className="border-b border-filete">
                <th scope="row" className="py-3 pr-3 font-semibold">{f.funcion}</th>
                <td className="py-3 pr-3 text-pizarra">{f.gratis}</td>
                <td className="py-3">{f.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mostrarBotones && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <EnlaceBoton href={ctaGratis} variante="secundario" ancho>
            Probar sin registro
          </EnlaceBoton>
          <EnlaceBoton href={ctaPremium} ancho>
            Ver el plan anual
          </EnlaceBoton>
        </div>
      )}
    </div>
  );
}
