import Link from "next/link";
import { SITIO } from "@/lib/sitio";
import { Logo } from "./logo";

const enlaces = [
  { href: "/legal/aviso-legal", texto: "Aviso legal" },
  { href: "/legal/privacidad", texto: "Privacidad" },
  { href: "/legal/cookies", texto: "Cookies" },
  { href: "/legal/condiciones", texto: "Condiciones" },
];

export function Pie() {
  return (
    <footer className="mt-auto border-t border-filete bg-superficie">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-pizarra">{SITIO.lema}.</p>
          <p className="mt-3 text-sm text-pizarra">{SITIO.avisoNoOficial}</p>
        </div>
        <nav aria-label="Información legal" className="flex flex-wrap gap-x-5 gap-y-1 text-sm md:flex-col">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} className="inline-flex min-h-11 items-center font-semibold text-pizarra hover:text-pino md:min-h-9">
              {e.texto}
            </Link>
          ))}
        </nav>
      </div>
      <p className="border-t border-filete py-4 text-center text-xs text-pizarra">
        © {new Date().getFullYear()} {SITIO.nombre}
      </p>
    </footer>
  );
}
