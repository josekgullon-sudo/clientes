"use client";

import { Zap } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { abrirCofre } from "@/app/app/ajustes";
import { Boton } from "@/components/boton";
import { Clara } from "@/components/mascota/clara";
import { sonidos } from "@/lib/ui/sonido";

/** Dibujo del cofre. `estado` cambia los colores: gris cerrado, dorado listo, abierto con luz. */
export function DibujoCofre({ estado, className = "size-14" }: { estado: "cerrado" | "listo" | "abierto"; className?: string }) {
  const gris = estado === "cerrado";
  const madera = gris ? "var(--filete)" : "#C2410C";
  const maderaOscura = gris ? "var(--pizarra)" : "#9A3412";
  const metal = gris ? "var(--papel-hundido)" : "#FACC15";
  return (
    <svg viewBox="0 0 64 64" className={`${className} overflow-visible ${estado === "abierto" ? "cofre-abierto" : ""}`} aria-hidden="true">
      <g className="cofre-luz">
        {[-50, -25, 0, 25, 50].map((a) => (
          <rect key={a} x="30.5" y="2" width="3" height="16" rx="1.5" fill="#FDE047" transform={`rotate(${a} 32 30)`} />
        ))}
      </g>
      <rect x="8" y="30" width="48" height="26" rx="5" fill={madera} />
      <rect x="8" y="48" width="48" height="8" rx="4" fill={maderaOscura} opacity="0.5" />
      <rect x="14" y="30" width="5" height="26" fill={metal} />
      <rect x="45" y="30" width="5" height="26" fill={metal} />
      <g className="cofre-tapa">
        <path d="M8 31 v-7 a10 10 0 0 1 10 -10 h28 a10 10 0 0 1 10 10 v7 z" fill={madera} />
        <rect x="14" y="14" width="5" height="17" fill={metal} />
        <rect x="45" y="14" width="5" height="17" fill={metal} />
        <rect x="8" y="27" width="48" height="4" fill={maderaOscura} opacity="0.6" />
      </g>
      <rect x="27" y="27" width="10" height="11" rx="3" fill={metal} stroke={gris ? "var(--filete)" : "#CA8A04"} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="1.6" fill={maderaOscura} />
    </svg>
  );
}

/**
 * Cofre del día: se desbloquea al completar las dos misiones y da XP extra.
 * Al abrirlo salta, suena y aparece Clara con la recompensa.
 */
export function CofreDiario({ listo, xpAbierto }: { listo: boolean; xpAbierto: number | null }) {
  const [premio, setPremio] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [pendiente, empezar] = useTransition();
  const cerrar = useRef<HTMLButtonElement>(null);
  const abierto = xpAbierto !== null || premio !== null;

  useEffect(() => {
    if (premio === null) return;
    cerrar.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setPremio(null);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [premio]);

  function abrir() {
    setError(false);
    empezar(async () => {
      const r = await abrirCofre();
      if ("error" in r) {
        setError(true);
        return;
      }
      sonidos.fin();
      setPremio(r.xp);
    });
  }

  const estado = abierto ? "abierto" : listo ? "listo" : "cerrado";

  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <span className={estado === "listo" ? "cofre-listo" : undefined}>
        <DibujoCofre estado={estado} className="size-12" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">Cofre del día</p>
        <p className="text-sm font-semibold text-pizarra">
          {abierto
            ? `¡Abierto! Has ganado ${xpAbierto ?? premio} XP extra.`
            : listo
              ? "¡Misiones cumplidas! Ábrelo."
              : "Cumple las dos misiones para abrirlo."}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm font-bold text-teja">
            No se ha podido abrir. Prueba otra vez.
          </p>
        )}
      </div>
      {estado === "listo" && (
        <Boton type="button" tamano="md" onClick={abrir} disabled={pendiente} className="shrink-0">
          {pendiente ? "…" : "Abrir"}
        </Boton>
      )}

      {premio !== null && (
        <div
          className="fondo-modal fixed inset-0 z-50 grid place-items-center bg-tinta/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-cofre"
          onClick={() => setPremio(null)}
        >
          <div
            className="rebote relative w-full max-w-sm overflow-hidden rounded-3xl border-2 border-filete bg-superficie p-6 text-center shadow-alta"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confeti" aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} style={{ left: `${4 + i * 7}%`, animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
            <div className="flex items-end justify-center gap-2">
              <Clara pose="celebra" className="size-28" />
              <DibujoCofre estado="abierto" className="mb-2 size-20" />
            </div>
            <h2 id="titulo-cofre" className="mt-3 font-display text-2xl font-black">
              ¡Cofre abierto!
            </h2>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-2xl bg-oro-suave px-4 py-2 font-display text-3xl font-black text-oro-texto">
              <Zap aria-hidden size={26} className="fill-subrayador text-subrayador" />
              <span className="cifras">+{premio} XP</span>
            </p>
            <p className="mt-3 font-semibold text-pizarra">Mañana te espera otro. ¡Sigue así!</p>
            <div className="mt-5">
              <Boton ref={cerrar} type="button" ancho onClick={() => setPremio(null)}>
                ¡Genial!
              </Boton>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
