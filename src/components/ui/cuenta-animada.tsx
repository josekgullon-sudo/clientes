"use client";

import { useEffect, useRef, useState } from "react";

const nf = new Intl.NumberFormat("es-ES");

/**
 * Número que sube desde 0 hasta su valor, como en las pantallas de resultado de las apps de juego.
 * Con `alVer`, espera a que el número entre en pantalla.
 */
export function CuentaAnimada({
  valor,
  sufijo = "",
  duracion = 900,
  alVer = false,
}: {
  valor: number;
  sufijo?: string;
  duracion?: number;
  alVer?: boolean;
}) {
  const [actual, setActual] = useState(alVer ? valor : 0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (quieto || valor === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sin animación, valor final directo
      setActual(valor);
      return;
    }
    let raf = 0;
    const correr = () => {
      const inicio = performance.now();
      const paso = (t: number) => {
        const p = Math.min(1, (t - inicio) / duracion);
        setActual(Math.round(valor * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(paso);
      };
      raf = requestAnimationFrame(paso);
    };
    if (!alVer || !ref.current || !("IntersectionObserver" in window)) {
      correr();
      return () => cancelAnimationFrame(raf);
    }
    // Se ve el valor final hasta que entra en pantalla; entonces cuenta desde 0.
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        setActual(0);
        correr();
      },
      { threshold: 0.6 },
    );
    obs.observe(ref.current);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [valor, duracion, alVer]);

  return (
    <span ref={ref} className="cifras" aria-label={`${nf.format(valor)}${sufijo}`}>
      <span aria-hidden="true">
        {nf.format(actual)}
        {sufijo}
      </span>
    </span>
  );
}
