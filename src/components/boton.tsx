import Link from "next/link";
import type { ComponentProps } from "react";

type Variante = "principal" | "secundario" | "suave" | "texto" | "premium" | "error";
type Tamano = "md" | "lg";

/*
 * Botones con relieve: un canto inferior de 4 px que se hunde al pulsar,
 * como en las apps de idiomas. Texto en mayúsculas y negrita.
 */
const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 font-extrabold transition-[transform,box-shadow,background-color,filter] duration-100 select-none disabled:cursor-not-allowed disabled:opacity-45";

const relieve = "active:translate-y-[3px] disabled:active:translate-y-0";

const tamanos: Record<Tamano, string> = {
  md: "min-h-12 text-[0.875rem]",
  lg: "min-h-14 text-[0.9375rem]",
};

const variantes: Record<Variante, string> = {
  principal: `bg-pino-boton text-sobre-pino shadow-[0_4px_0_var(--pino-sombra)] hover:bg-pino-boton-hover active:shadow-[0_1px_0_var(--pino-sombra)] ${relieve}`,
  secundario: `border-2 border-filete bg-superficie text-tinta shadow-[0_3px_0_var(--filete)] hover:bg-papel-hundido active:shadow-none ${relieve}`,
  suave: `bg-pino-suave text-pino hover:brightness-95 ${relieve}`,
  error: `bg-[#dc2626] text-white shadow-[0_4px_0_#991b1b] hover:brightness-105 active:shadow-[0_1px_0_#991b1b] ${relieve}`,
  premium: `bg-[#7c3aed] text-white shadow-[0_4px_0_#5b21b6] hover:brightness-110 active:shadow-[0_1px_0_#5b21b6] ${relieve}`,
  texto:
    "min-h-11 px-2 font-bold text-pino underline decoration-pino/35 decoration-2 underline-offset-4 hover:decoration-pino",
};

export function clasesBoton(variante: Variante = "principal", ancho = false, tamano: Tamano = "lg") {
  const forma = variante === "texto" ? "" : `${tamanos[tamano]} uppercase tracking-wide`;
  return `${base} ${forma} ${variantes[variante]} ${ancho ? "w-full" : ""}`;
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
