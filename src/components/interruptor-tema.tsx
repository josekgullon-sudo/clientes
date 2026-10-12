"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Tema = "system" | "light" | "dark";
const siguiente: Record<Tema, Tema> = { system: "light", light: "dark", dark: "system" };
const textos: Record<Tema, string> = {
  system: "Tema automático",
  light: "Tema claro",
  dark: "Tema oscuro",
};
const iconos = { system: Monitor, light: Sun, dark: Moon };

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

  const Icono = iconos[tema];
  return (
    <button
      type="button"
      onClick={cambiar}
      className="inline-flex size-11 items-center justify-center rounded-xl text-pizarra transition hover:bg-papel-hundido hover:text-tinta"
      aria-label={`${textos[tema]}. Pulsa para cambiar.`}
      title={textos[tema]}
    >
      <Icono aria-hidden size={19} strokeWidth={2.2} />
    </button>
  );
}
