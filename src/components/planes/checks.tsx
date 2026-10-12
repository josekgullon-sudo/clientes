import { Check } from "lucide-react";

export function Checks({ puntos, claro = false }: { puntos: string[]; claro?: boolean }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {puntos.map((p) => (
        <li key={p} className="flex items-start gap-2.5 text-[0.975rem]">
          <span
            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${claro ? "bg-superficie text-pino" : "bg-pino-suave text-pino"}`}
            aria-hidden="true"
          >
            <Check size={13} strokeWidth={3.5} />
          </span>
          {p}
        </li>
      ))}
    </ul>
  );
}

export const PUNTOS_GRATIS = ["10 preguntas al día", "Explicación y artículo en cada una", "Repaso de tus fallos", "Niveles 1 y 2 de cada tema", "1 simulacro de prueba"];
export const PUNTOS_PREMIUM = ["Preguntas sin límite", "Todos los niveles y exámenes de tema", "Simulacros ilimitados", "Test a medida por temas", "Predicción de nota y estadísticas"];
