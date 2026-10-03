import type { ReactNode } from "react";

/** Anotación al margen del temario: filete vertical y texto de lectura. */
export function NotaMargen({
  children,
  tono = "neutro",
}: {
  children: ReactNode;
  tono?: "neutro" | "acierto" | "fallo";
}) {
  const borde =
    tono === "acierto" ? "border-pino" : tono === "fallo" ? "border-teja" : "border-pizarra";
  return (
    <div
      className={`max-w-lectura border-l-[3px] ${borde} pl-4 font-serif text-[1.0625rem] leading-relaxed`}
    >
      {children}
    </div>
  );
}
