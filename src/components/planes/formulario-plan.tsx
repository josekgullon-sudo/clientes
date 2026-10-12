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
  const puntos = destacado ? PUNTOS_PREMIUM : ["Lo mismo que el anual", "Mes a mes", "Sin permanencia"];
  return (
    <form
      action="/api/stripe/checkout"
      method="post"
      onSubmit={() => evento("checkout_start", { plan })}
      className={`tarjeta relative flex flex-col p-6 ${destacado ? "border-2 border-pino bg-pino-suave" : ""}`}
    >
      <input type="hidden" name="plan" value={plan} />
      {etiqueta && (
        <p className="absolute -top-3 left-6 rounded-full bg-pino-boton px-3 py-1 text-xs font-semibold text-sobre-pino">{etiqueta}</p>
      )}
      <h2 className="font-serif text-2xl font-semibold">{titulo}</h2>
      <p className="mt-2 font-serif text-4xl font-semibold">
        {precio}
        <span className="font-sans text-base font-normal text-pizarra"> /mes</span>
      </p>
      <p className="mt-1 text-sm text-pizarra">{detalle}</p>
      <Checks puntos={puntos} />
      <Boton type="submit" ancho variante={destacado ? "principal" : "secundario"} className="mt-6">
        Elegir {titulo.toLowerCase()}
      </Boton>
    </form>
  );
}
