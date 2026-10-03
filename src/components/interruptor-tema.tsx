"use client";

import { useEffect, useState } from "react";

type Tema = "system" | "light" | "dark";
const siguiente: Record<Tema, Tema> = { system: "light", light: "dark", dark: "system" };
const textos: Record<Tema, string> = {
  system: "Tema: automático",
  light: "Tema: claro",
  dark: "Tema: oscuro",
};

export function InterruptorTema() {
  const [tema, setTema] = useState<Tema>("system");

  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con el script previo al pintado
    if (t === "light" || t === "dark") setTema(t);
  }, []);

  function cambiar() {
    const nuevo = siguiente[tema];
    setTema(nuevo);
    const raiz = document.documentElement;
    try {
      if (nuevo === "system") {
        delete raiz.dataset.theme;
        localStorage.removeItem("tema");
      } else {
        raiz.dataset.theme = nuevo;
        localStorage.setItem("tema", nuevo);
      }
    } catch {
      /* sin almacenamiento: el cambio dura hasta recargar */
    }
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      className="inline-flex min-h-11 items-center gap-2 px-2 text-[0.95rem] text-pizarra hover:text-tinta"
      aria-label={`${textos[tema]}. Pulsa para cambiar.`}
    >
      <IconoTema tema={tema} />
      <span className="hidden sm:inline">{textos[tema]}</span>
    </button>
  );
}

function IconoTema({ tema }: { tema: Tema }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {tema === "dark" && <circle cx="10" cy="10" r="7.5" fill="currentColor" />}
      {tema === "system" && <path d="M10 2.5a7.5 7.5 0 0 1 0 15z" fill="currentColor" />}
    </svg>
  );
}
