"use client";

import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Boton } from "@/components/boton";
import { Clara } from "@/components/mascota/clara";

const CLAVE = "instalar-cerrado";

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * Invita a instalar la web como app. En Android y escritorio usa el aviso del navegador;
 * en iPhone explica los dos toques de Safari. No sale si ya está instalada o si se cerró.
 */
export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cerrado = false;
    try {
      cerrado = localStorage.getItem(CLAVE) === "1";
    } catch {
      /* sin almacenamiento */
    }
    const instalada =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (cerrado || instalada) return;

    const esIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (esIos) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- depende del navegador, solo se sabe aquí
      setIos(true);
      setVisible(true);
    }
    const alPedir = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", alPedir);
    return () => window.removeEventListener("beforeinstallprompt", alPedir);
  }, []);

  function cerrar() {
    setVisible(false);
    try {
      localStorage.setItem(CLAVE, "1");
    } catch {
      /* sin almacenamiento */
    }
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "accepted") cerrar();
    setEvento(null);
  }

  if (!visible || (!ios && !evento)) return null;

  return (
    <section
      aria-labelledby="instalar"
      className="rebote relative flex items-center gap-3 rounded-[1.25rem] border-2 border-cielo bg-cielo-suave p-4 pr-10"
    >
      <Clara pose="senala" animada={false} className="size-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <h2 id="instalar" className="font-display text-lg leading-tight font-black text-cielo-texto">
          Llévame en tu móvil
        </h2>
        {ios ? (
          <p className="mt-1 text-sm font-semibold">
            Pulsa <Share aria-label="Compartir" size={15} className="inline align-[-2px]" /> y luego «Añadir a pantalla de
            inicio».
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-sm font-semibold">Instálame como app y estudia con un toque.</p>
            <Boton type="button" tamano="md" onClick={instalar} className="mt-2">
              Instalar
            </Boton>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar"
        className="absolute top-2 right-2 grid size-9 place-items-center rounded-xl text-pizarra hover:bg-superficie"
      >
        <X aria-hidden size={18} />
      </button>
    </section>
  );
}
