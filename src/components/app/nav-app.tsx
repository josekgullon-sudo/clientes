"use client";

import { BarChart3, House, Route, Trophy, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const secciones = [
  { href: "/app", texto: "Hoy", icono: House, color: "var(--pino)" },
  { href: "/app/camino", texto: "Camino", icono: Route, color: "var(--oro-texto)" },
  { href: "/app/liga", texto: "Liga", icono: Trophy, color: "var(--naranja-texto)" },
  { href: "/app/estadisticas", texto: "Progreso", icono: BarChart3, color: "var(--cielo-texto)" },
  { href: "/app/cuenta", texto: "Perfil", icono: UserRound, color: "var(--morado-texto)" },
];

function activa(ruta: string, href: string) {
  return href === "/app" ? ruta === "/app" : ruta.startsWith(href);
}

/** Navegación del área privada: arriba en escritorio, barra inferior al alcance del pulgar en móvil. */
export function NavApp({ lugar }: { lugar: "cabecera" | "inferior" }) {
  const ruta = usePathname();

  if (lugar === "cabecera") {
    return (
      <nav aria-label="Secciones" className="hidden items-center gap-1 md:flex">
        {secciones.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={activa(ruta, s.href) ? "page" : undefined}
            className="inline-flex min-h-11 items-center rounded-xl px-3 font-semibold text-pizarra transition hover:bg-papel-hundido hover:text-tinta aria-[current=page]:bg-pino-suave aria-[current=page]:text-pino"
          >
            {s.texto}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-filete bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {secciones.map((s) => {
          const on = activa(ruta, s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.75rem] font-black transition ${on ? "" : "text-pizarra"}`}
                style={on ? { color: s.color } : undefined}
              >
                <span
                  className={`grid h-9 w-12 place-items-center rounded-xl border-2 transition ${on ? "" : "border-transparent"}`}
                  style={on ? { borderColor: s.color, background: `color-mix(in srgb, ${s.color} 12%, transparent)` } : undefined}
                >
                  <s.icono aria-hidden size={22} strokeWidth={on ? 2.6 : 2.2} />
                </span>
                {s.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
