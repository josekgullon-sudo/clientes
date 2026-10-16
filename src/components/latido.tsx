"use client";

import { useEffect } from "react";

const CADA_MS = 60_000;

/** Avisa de que la pestaña sigue abierta. No llama si está en segundo plano. */
export function Latido() {
  useEffect(() => {
    let timer = 0;

    const pulso = () => {
      if (document.visibilityState !== "visible") return;
      void fetch("/api/latido", { method: "POST", keepalive: true });
    };

    const programar = () => {
      window.clearInterval(timer);
      timer = 0;
      if (document.visibilityState !== "visible") return;
      pulso();
      timer = window.setInterval(pulso, CADA_MS);
    };

    programar();
    document.addEventListener("visibilitychange", programar);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", programar);
    };
  }, []);

  return null;
}
