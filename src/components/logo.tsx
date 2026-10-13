import { SITIO } from "@/lib/sitio";

/** Marca: una pregunta marcada como correcta sobre el trazo de subrayador. */
export function MarcaLogo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--pino-boton)" />
      <rect x="6" y="20" width="20" height="5" rx="2.5" fill="var(--subrayador)" />
      <path d="M9.5 14.5l4 4 9-9.5" fill="none" stroke="var(--sobre-pino)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label={SITIO.nombre}>
      <MarcaLogo />
      <span className="font-display text-[1.125rem] leading-none font-extrabold tracking-tight whitespace-nowrap sm:text-xl" aria-hidden="true">
        Oposiciones <span className="subrayado">Claras</span>
      </span>
    </span>
  );
}
