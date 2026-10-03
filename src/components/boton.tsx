import Link from "next/link";
import type { ComponentProps } from "react";

type Variante = "principal" | "secundario" | "texto";

const base =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-md px-5 text-[1.0625rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45";

const variantes: Record<Variante, string> = {
  principal: "bg-tinta text-papel hover:bg-tinta/90",
  secundario:
    "border border-tinta/70 text-tinta hover:bg-papel-hundido",
  texto: "min-h-11 px-2 text-tinta underline decoration-filete decoration-2 underline-offset-4 hover:decoration-tinta",
};

export function clasesBoton(variante: Variante = "principal", ancho = false) {
  return `${base} ${variantes[variante]} ${ancho ? "w-full" : ""}`;
}

export function Boton({
  variante = "principal",
  ancho = false,
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: Variante; ancho?: boolean }) {
  return (
    <button
      className={`${clasesBoton(variante, ancho)} ${className}`}
      {...props}
    />
  );
}

export function EnlaceBoton({
  variante = "principal",
  ancho = false,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante; ancho?: boolean }) {
  return (
    <Link className={`${clasesBoton(variante, ancho)} ${className}`} {...props} />
  );
}
