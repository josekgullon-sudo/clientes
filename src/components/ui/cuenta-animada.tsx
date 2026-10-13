"use client";

import { useEffect, useState } from "react";

/** Número que sube desde 0 hasta su valor, como en las pantallas de resultado de las apps de juego. */
export function CuentaAnimada({ valor, sufijo = "", duracion = 900 }: { valor: number; sufijo?: string; duracion?: number }) {
  const [actual, setActual] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || valor === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sin animación, valor final directo
      setActual(valor);
      return;
    }
    let raf = 0;
    const inicio = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracion);
      setActual(Math.round(valor * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, duracion]);

  return (
    <span className="cifras" aria-label={`${valor}${sufijo}`}>
      <span aria-hidden="true">
        {actual}
        {sufijo}
      </span>
    </span>
  );
}
