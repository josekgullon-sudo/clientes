"use client";

import { Boton } from "@/components/boton";
import { evento } from "@/components/evento";

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
      className={`rounded-xl border p-5 ${destacado ? "border-pino bg-pino-suave" : "border-filete"}`}
    >
      <input type="hidden" name="plan" value={plan} />
      {etiqueta && <p className="text-[0.85rem] font-semibold tracking-wide text-pino uppercase">{etiqueta}</p>}
      <h2 className="font-serif text-xl font-semibold">{titulo}</h2>
      <p className="mt-1 font-serif text-3xl font-semibold">
        {precio}
        <span className="font-sans text-base font-normal text-pizarra">{plan === "anual" ? " /mes" : " /mes"}</span>
      </p>
      <p className="mt-1 text-pizarra">{detalle}</p>
      <Boton type="submit" ancho variante={destacado ? "principal" : "secundario"} className="mt-4">
        Elegir plan {titulo.toLowerCase()}
      </Boton>
    </form>
  );
}
