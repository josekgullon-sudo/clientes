import { SITIO } from "@/lib/sitio";

/** Marca: la cara de Clara, el rotulador fluorescente, asomando bajo su capuchón. Colores fijos de marca. */
export function MarcaLogo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="3" y="3" width="42" height="43" rx="15" fill="#FACC15" />
      <path d="M33 6 q9 4 9 18 v8 q0 10 -8 13 q5 -6 5 -15 v-8 q0 -12 -6 -16z" fill="#EAB308" opacity="0.6" />
      <path d="M3 18 v-1 a14 14 0 0 1 14 -14 h14 a14 14 0 0 1 14 14 v1 z" fill="#15803D" />
      <rect x="3" y="15.5" width="42" height="4" fill="#116632" />
      <rect x="10" y="7" width="9" height="3" rx="1.5" fill="#fff" opacity="0.35" />
      <ellipse cx="17.5" cy="28" rx="4" ry="4.6" fill="#fff" />
      <ellipse cx="30.5" cy="28" rx="4" ry="4.6" fill="#fff" />
      <circle cx="18" cy="28.4" r="2.3" fill="#1A2620" />
      <circle cx="31" cy="28.4" r="2.3" fill="#1A2620" />
      <circle cx="18.8" cy="27.4" r="0.8" fill="#fff" />
      <circle cx="31.8" cy="27.4" r="0.8" fill="#fff" />
      <ellipse cx="11.5" cy="34.5" rx="2.6" ry="1.6" fill="#FB7185" opacity="0.6" />
      <ellipse cx="36.5" cy="34.5" rx="2.6" ry="1.6" fill="#FB7185" opacity="0.6" />
      <path d="M19 34.5 q5 7 10 0 z" fill="#1A2620" />
      <path d="M21.3 37.3 q2.7 1.8 5.4 0 q-2.7 -1.4 -5.4 0z" fill="#FB7185" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2" aria-label={SITIO.nombre}>
      <MarcaLogo className="size-9" />
      <span className="font-display text-[1.1875rem] leading-none font-black tracking-tight whitespace-nowrap sm:text-[1.3125rem]" aria-hidden="true">
        <span className="text-pino">Oposiciones</span> <span className="subrayado">Claras</span>
      </span>
    </span>
  );
}
