import Link from "next/link";
import type { ComponentProps } from "react";

type Variante = "principal" | "secundario" | "suave" | "texto";
type Tamano = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 font-bold transition duration-150 select-none active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0";

const tamanos: Record<Tamano, string> = {
  md: "min-h-12 text-[0.975rem]",
  lg: "min-h-14 text-[1.0625rem]",
};

const variantes: Record<Variante, string> = {
  principal:
    "bg-pino-boton text-sobre-pino shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)] hover:bg-pino-boton-hover",
  secundario: "border border-filete bg-superficie text-tinta shadow-tarjeta hover:border-pino/50 hover:bg-pino-suave",
  suave: "bg-pino-suave text-pino hover:brightness-95",
  texto:
    "min-h-11 px-2 text-pino underline decoration-pino/35 decoration-2 underline-offset-4 hover:decoration-pino",
};

export function clasesBoton(variante: Variante = "principal", ancho = false, tamano: Tamano = "lg") {
  return `${base} ${variante === "texto" ? "" : tamanos[tamano]} ${variantes[variante]} ${ancho ? "w-full" : ""}`;
}

type Extra = { variante?: Variante; ancho?: boolean; tamano?: Tamano };

export function Boton({
  variante = "principal",
  ancho = false,
  tamano = "lg",
  className = "",
  ...props
}: ComponentProps<"button"> & Extra) {
  return <button className={`${clasesBoton(variante, ancho, tamano)} ${className}`} {...props} />;
}

export function EnlaceBoton({
  variante = "principal",
  ancho = false,
  tamano = "lg",
  className = "",
  ...props
}: ComponentProps<typeof Link> & Extra) {
  return <Link className={`${clasesBoton(variante, ancho, tamano)} ${className}`} {...props} />;
}
