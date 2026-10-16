"use client";

import { useEffect } from "react";

type Plausible = (evento: string, opciones?: { props?: Record<string, string | number> }) => void;

/** Evento de embudo. No hace nada si no hay analítica configurada. */
export function evento(nombre: string, props?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  const plausible = (window as Window & { plausible?: Plausible }).plausible;
  plausible?.(nombre, props ? { props } : undefined);
}

/** `tipo` además lo guarda el servidor (embudo). `nombre` sigue yendo a la analítica, si está. */
export function Evento({ nombre, tipo, meta }: { nombre: string; tipo?: string; meta?: Record<string, string> }) {
  const extra = meta ? JSON.stringify(meta) : "";
  useEffect(() => {
    evento(nombre);
    if (!tipo) return;
    fetch("/api/eventos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tipo, meta: extra ? JSON.parse(extra) : {} }),
    }).catch(() => {});
  }, [nombre, tipo, extra]);
  return null;
}
