"use client";

import { useEffect, useState } from "react";
import { EnlaceBoton } from "@/components/boton";

/** CTA de móvil a partir de la mitad del scroll, para no tapar la portada ni el pie. */
export function CtaFija({ href, texto }: { href: string; texto: string }) {
  const [ver, setVer] = useState(false);

  useEffect(() => {
    const alScroll = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = alto > 0 ? window.scrollY / alto : 0;
      setVer(ratio > 0.3 && ratio < 0.9);
    };
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  return (
    <div
      aria-hidden={!ver}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-filete bg-superficie/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition duration-300 md:hidden ${ver ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
    >
      <EnlaceBoton href={href} ancho tabIndex={ver ? 0 : -1}>
        {texto}
      </EnlaceBoton>
    </div>
  );
}
