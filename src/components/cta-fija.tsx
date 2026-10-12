"use client";

import { useEffect, useState } from "react";
import { EnlaceBoton } from "@/components/boton";

/** CTA de móvil a partir de la mitad del scroll, para no tapar el pie. */
export function CtaFija({ href, texto }: { href: string; texto: string }) {
  const [ver, setVer] = useState(false);

  useEffect(() => {
    const alScroll = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = alto > 0 ? window.scrollY / alto : 0;
      setVer(ratio > 0.5 && ratio < 0.92);
    };
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  if (!ver) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-filete bg-papel p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <EnlaceBoton href={href} ancho>
        {texto}
      </EnlaceBoton>
    </div>
  );
}
