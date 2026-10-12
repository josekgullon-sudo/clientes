"use client";

import { useEffect } from "react";

type Plausible = (evento: string, opciones?: { props?: Record<string, string | number> }) => void;

/** Evento de embudo. No hace nada si no hay analítica configurada. */
export function evento(nombre: string, props?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  const plausible = (window as Window & { plausible?: Plausible }).plausible;
  plausible?.(nombre, props ? { props } : undefined);
}

export function Evento({ nombre }: { nombre: string }) {
  useEffect(() => {
    evento(nombre);
  }, [nombre]);
  return null;
}
