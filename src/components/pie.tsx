import Link from "next/link";
import { SITIO } from "@/lib/sitio";

const enlaces = [
  { href: "/legal/aviso-legal", texto: "Aviso legal" },
  { href: "/legal/privacidad", texto: "Privacidad" },
  { href: "/legal/cookies", texto: "Cookies" },
  { href: "/legal/condiciones", texto: "Condiciones" },
];

export function Pie() {
  return (
    <footer className="mt-auto border-t border-filete">
      <div className="mx-auto max-w-5xl px-4 py-8 text-[0.95rem] text-pizarra">
        <p className="max-w-lectura">{SITIO.avisoNoOficial}</p>
        <nav aria-label="Información legal" className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="inline-flex min-h-11 items-center underline decoration-filete underline-offset-4 hover:text-tinta"
            >
              {e.texto}
            </Link>
          ))}
        </nav>
        <p className="mt-4">© {new Date().getFullYear()} {SITIO.nombre}</p>
      </div>
    </footer>
  );
}
