import { Flame, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Clara } from "@/components/mascota/clara";
import type { TemaNivel } from "@/lib/test/nivel";

/** Cierre de cualquier test: la cifra, la racha y el siguiente paso. Poco texto. */
export function Cierre({
  aciertos,
  total,
  xp,
  racha,
  temas,
  titulo,
  acciones,
  porTema = false,
}: {
  aciertos: number;
  total: number;
  xp: number;
  racha: number;
  temas: TemaNivel[];
  titulo: string;
  acciones: ReactNode;
  /** En el test de nivel se ve el porcentaje de cada tema. */
  porTema?: boolean;
}) {
  const ratio = total ? aciertos / total : 0;
  return (
    <section aria-labelledby="titulo-cierre" className="mx-auto flex w-full max-w-lectura flex-col gap-6 px-4 pt-8">
      <div className="relative flex flex-col items-center text-center">
        {ratio >= 0.6 && (
          <div className="confeti" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} style={{ left: `${4 + i * 8}%`, animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
        )}
        <Clara pose={ratio >= 0.6 ? "celebra" : "animo"} className="size-28" />
        <h1 id="titulo-cierre" className="mt-3 font-display text-2xl font-black">
          {titulo}
        </h1>
        <p className="cifras mt-1 font-display text-5xl leading-none font-black text-pino">
          {aciertos}
          <span className="text-3xl text-pizarra">/{total}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="tarjeta p-4 text-center">
          <p className="antetitulo">XP</p>
          <p className="mt-1 flex items-center justify-center gap-1 font-display text-2xl font-black text-oro-texto">
            <Zap aria-hidden size={20} className="fill-subrayador" />
            <span className="cifras">+{xp}</span>
          </p>
        </div>
        <div className="tarjeta p-4 text-center">
          <p className="antetitulo">Racha</p>
          <p className="mt-1 flex items-center justify-center gap-1 font-display text-2xl font-black text-naranja-texto">
            <Flame aria-hidden size={20} className="fill-naranja" />
            <span className="cifras">{racha}</span>
          </p>
        </div>
      </div>

      {temas.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg font-black">{porTema ? "Por tema" : "A repasar"}</h2>
          <ul className="tarjeta divide-y-2 divide-filete">
            {temas.map((tema) => (
              <li key={tema.etiqueta} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="line-clamp-2 leading-snug font-semibold">{tema.etiqueta}</span>
                <span
                  className={`cifras shrink-0 rounded-full px-2.5 py-1 text-sm font-extrabold ${
                    tema.porcentaje >= 60 ? "bg-pino-suave text-pino" : "bg-teja-suave text-teja"
                  }`}
                >
                  {porTema ? `${tema.porcentaje} %` : `${tema.aciertos}/${tema.total}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3">{acciones}</div>
    </section>
  );
}
