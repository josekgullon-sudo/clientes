import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

const enlaces = [
  { id: "resumen", href: "/admin", texto: "Resumen" },
  { id: "personas", href: "/admin/usuarios", texto: "Personas" },
  { id: "embudo", href: "/admin/embudo", texto: "Embudo" },
  { id: "correos", href: "/admin/emails", texto: "Correos" },
] as const;

export function MarcoAdmin({ activo, children }: { activo: (typeof enlaces)[number]["id"]; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <nav aria-label="Panel" className="flex gap-1">
          {enlaces.map((e) => (
            <Link
              key={e.id}
              href={e.href}
              className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold ${activo === e.id ? "bg-pino-suave text-pino" : "text-pizarra hover:bg-papel-hundido"}`}
            >
              {e.texto}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
