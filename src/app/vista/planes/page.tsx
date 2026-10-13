import { Cabecera } from "@/components/cabecera";
import { FormularioPlan } from "@/components/planes/formulario-plan";
import { PRECIOS, eur, precioMesEquivalente } from "@/lib/sitio";

export default function VistaPlanes() {
  const ahorro = Math.round((1 - PRECIOS.anual / (PRECIOS.mensual * 12)) * 100);
  return (
    <>
      <Cabecera />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-16">
        <h1 className="font-display text-4xl font-extrabold">Planes</h1>
        <div className="mt-10 grid items-start gap-6 md:grid-cols-2">
          <FormularioPlan
            plan="anual"
            destacado
            titulo="Anual"
            precio={eur.format(precioMesEquivalente)}
            detalle={`${eur.format(PRECIOS.anual)} al año · ahorras un ${ahorro} %`}
            etiqueta="Más elegido"
          />
          <FormularioPlan plan="mensual" titulo="Mensual" precio={eur.format(PRECIOS.mensual)} detalle="Sin permanencia" />
        </div>
      </main>
    </>
  );
}
