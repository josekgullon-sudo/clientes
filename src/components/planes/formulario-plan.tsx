"use client";

import { Boton } from "@/components/boton";
import { evento } from "@/components/evento";
import { Checks, PUNTOS_PREMIUM } from "./checks";

export function FormularioPlan({
  plan,
  titulo,
  precio,
  detalle,
  etiqueta,
  destacado = false,
}: {
  plan: "anual" | "mensual";
  titulo: string;
  precio: string;
  detalle: string;
  etiqueta?: string;
  destacado?: boolean;
}) {
  return (
    <form
      action="/api/stripe/checkout"
      method="post"
      onSubmit={() => evento("checkout_start", { plan })}
      className={`relative flex flex-col rounded-[1.25rem] bg-superficie p-6 ${destacado ? "border-2 border-pino shadow-alta" : "border border-filete shadow-tarjeta"}`}
    >
      <input type="hidden" name="plan" value={plan} />
      {etiqueta && (
        <p className="absolute -top-3.5 left-6 rounded-full bg-subrayador px-3 py-1 text-xs font-extrabold text-subrayador-texto">{etiqueta}</p>
      )}
      <h2 className={`text-lg font-bold ${destacado ? "text-pino" : ""}`}>{titulo}</h2>
      <p className="mt-3 font-serif text-5xl font-semibold">
        {precio}
        <span className="font-sans text-base font-semibold text-pizarra"> /mes</span>
      </p>
      <p className="cifras mt-1 text-sm text-pizarra">{detalle}</p>
      {destacado && (
        <div className="mt-5">
          <Checks puntos={PUNTOS_PREMIUM} />
        </div>
      )}
      <Boton type="submit" ancho variante={destacado ? "principal" : "secundario"} className="mt-6">
        Elegir {titulo.toLowerCase()}
      </Boton>
    </form>
  );
}
