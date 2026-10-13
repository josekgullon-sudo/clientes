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
      className={`relative flex flex-col rounded-[1.25rem] bg-superficie p-6 ${destacado ? "border-2 border-[#a78bfa] shadow-[0_4px_0_#a78bfa]" : "border-2 border-filete shadow-[0_3px_0_var(--filete)]"}`}
    >
      <input type="hidden" name="plan" value={plan} />
      {etiqueta && (
        <p className="absolute -top-3.5 left-6 rounded-full bg-subrayador px-3 py-1 text-xs font-extrabold text-subrayador-texto">{etiqueta}</p>
      )}
      <h2 className={`font-display text-xl font-black ${destacado ? "text-morado-texto" : ""}`}>{titulo}</h2>
      <p className="mt-3 font-display text-5xl font-extrabold">
        {precio}
        <span className="font-sans text-base font-semibold text-pizarra"> /mes</span>
      </p>
      <p className="cifras mt-1 text-sm text-pizarra">{detalle}</p>
      {destacado && (
        <div className="mt-5">
          <Checks puntos={PUNTOS_PREMIUM} />
        </div>
      )}
      <Boton type="submit" ancho variante={destacado ? "premium" : "secundario"} className="mt-6">
        Elegir {titulo.toLowerCase()}
      </Boton>
    </form>
  );
}
