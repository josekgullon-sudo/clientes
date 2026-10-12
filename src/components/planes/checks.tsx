import { Check } from "lucide-react";

export function Checks({ puntos }: { puntos: string[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {puntos.map((p) => (
        <li key={p} className="flex items-center gap-2 text-[0.95rem]">
          <Check aria-hidden size={18} className="shrink-0 text-pino" />
          {p}
        </li>
      ))}
    </ul>
  );
}

export const PUNTOS_GRATIS = ["10 preguntas al día", "Niveles 1 y 2", "Repaso de tus fallos", "1 simulacro de prueba"];
export const PUNTOS_PREMIUM = ["Sin límite diario", "Todos los niveles", "Simulacros ilimitados", "Predicción de nota"];
