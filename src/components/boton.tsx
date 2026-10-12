import Link from "next/link";
import type { ComponentProps } from "react";

type Variante = "principal" | "secundario" | "texto";

const base =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 text-[1.0625rem] font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-45";

const variantes: Record<Variante, string> = {
  principal: "bg-pino-boton text-sobre-pino shadow-tarjeta hover:brightness-110",
  secundario: "border border-pino/40 bg-papel text-tinta shadow-tarjeta hover:bg-pino-suave",
  texto: "min-h-11 px-2 text-pino underline decoration-pino/40 decoration-2 underline-offset-4 hover:decoration-pino",
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
