import Script from "next/script";

/**
 * Analítica opcional y sin cookies (Plausible).
 * Solo se carga si existe NEXT_PUBLIC_PLAUSIBLE_DOMAIN.
 * NEXT_PUBLIC_PLAUSIBLE_SRC permite un host propio; si no, usa plausible.io.
 */
export function Analitica() {
  const dominio = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!dominio) return null;
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";
  return <Script defer data-domain={dominio} src={src} strategy="afterInteractive" />;
}
