import type { ReactNode } from "react";
import { Clara, type PoseClara } from "./clara";

/** Clara hablando: la mascota con un bocadillo al lado. */
export function ClaraDice({
  pose = "hola",
  children,
  tamano = "size-24",
  className = "",
  saludoInfinito = false,
}: {
  pose?: PoseClara;
  saludoInfinito?: boolean;
  children: ReactNode;
  tamano?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <Clara pose={pose} saludoInfinito={saludoInfinito} className={`${tamano} shrink-0`} />
      <div className="relative mb-6 min-w-0 flex-1 rounded-2xl border-2 border-filete bg-superficie px-4 py-3 font-bold leading-snug">
        <span
          aria-hidden="true"
          className="absolute bottom-4 -left-[9px] size-4 rotate-45 border-b-2 border-l-2 border-filete bg-superficie"
        />
        {children}
      </div>
    </div>
  );
}
