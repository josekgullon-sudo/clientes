import { Target, Trophy, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Clara, type PoseClara } from "@/components/mascota/clara";
import { CuentaAnimada } from "@/components/ui/cuenta-animada";
import type { Resultado } from "@/lib/test/tipos";

const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

function mensaje(r: Resultado): { titulo: string; texto: string; pose: PoseClara } {
  const p = r.total ? r.aciertos / r.total : 0;
  if (p === 1) return { titulo: "¡Pleno!", texto: "Todas bien. Lo llevas preparado.", pose: "celebra" };
  if (p >= 0.8) return { titulo: "¡Muy bien!", texto: "Repasa los detalles que se escaparon y será tuyo.", pose: "celebra" };
  if (p >= 0.6) return { titulo: "¡Vas bien!", texto: "Repasa lo que has fallado y lo tendrás.", pose: "feliz" };
  if (p >= 0.4) return { titulo: "Buen comienzo", texto: "La corrección te dice exactamente qué repasar.", pose: "animo" };
  return { titulo: "Así se aprende", texto: "Cada fallo de hoy es una pregunta que no fallarás en el examen.", pose: "animo" };
}

const tonosFicha = {
  oro: { borde: "border-subrayador", cabecera: "bg-subrayador text-subrayador-texto" },
  pino: { borde: "border-pino-vivo", cabecera: "bg-pino-vivo text-[#0b3d1d]" },
  cielo: { borde: "border-cielo-vivo", cabecera: "bg-cielo-vivo text-[#082f49]" },
  morado: { borde: "border-[#a78bfa]", cabecera: "bg-[#a78bfa] text-[#2e1065]" },
};

function Ficha({
  etiqueta,
  color,
  icono,
  children,
}: {
  etiqueta: string;
  color: keyof typeof tonosFicha;
  icono: ReactNode;
  children: ReactNode;
}) {
  const t = tonosFicha[color];
  return (
    <div className={`rebote overflow-hidden rounded-2xl border-2 ${t.borde}`}>
      <p className={`px-2 py-1 text-center text-[0.6875rem] font-black tracking-wider uppercase ${t.cabecera}`}>{etiqueta}</p>
      <p className="flex items-center justify-center gap-1.5 bg-superficie px-2 py-3 text-xl font-black">
        {icono}
        {children}
      </p>
    </div>
  );
}

/** Resultado de un test, al estilo de las apps de juego: Clara, fichas de colores y lo que toca repasar. */
export function Resumen({
  resultado,
  penalizacion,
  temas,
  acciones,
  antes,
  xp,
  titulo,
}: {
  resultado: Resultado;
  penalizacion: number;
  /** Se ignora; se mantiene por compatibilidad. */
  estados?: ("acierto" | "fallo" | "pendiente")[];
  temas: { etiqueta: string; total: number; aciertos: number }[];
  acciones: ReactNode;
  /** Algo que mostrar debajo de las fichas (racha, logros). */
  antes?: ReactNode;
  /** XP ganada, si la hay. */
  xp?: number;
  /** Título en lugar del mensaje según la nota (p. ej. «¡Lección completada!»). */
  titulo?: string;
}) {
  const r = resultado;
  const m = mensaje(r);
  const precision = r.total ? Math.round((r.aciertos / r.total) * 100) : 0;
  const fiesta = precision >= 60;

  return (
    <section aria-labelledby="titulo-resumen" className="mx-auto flex w-full max-w-lectura flex-col gap-6 px-4 pt-8">
      <div className="relative flex flex-col items-center text-center">
        {fiesta && (
          <div className="confeti" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => (
              <span key={i} style={{ left: `${3 + i * 6}%`, animationDelay: `${i * 0.06}s` }} />
            ))}
          </div>
        )}
        <Clara pose={m.pose} className="size-36" />
        <h1 id="titulo-resumen" className="mt-4 font-display text-[2rem] leading-tight font-black text-pino">
          {titulo ?? m.titulo}
        </h1>
        <p className="mt-1 max-w-sm font-semibold text-pizarra">{m.texto}</p>
      </div>

      <div className={`grid gap-3 ${xp !== undefined ? "grid-cols-3" : "grid-cols-2"}`}>
        {xp !== undefined && (
          <Ficha etiqueta="XP ganada" color="oro" icono={<Zap aria-hidden size={20} className="text-oro-texto" />}>
            <CuentaAnimada valor={xp} />
          </Ficha>
        )}
        <Ficha etiqueta="Precisión" color="pino" icono={<Target aria-hidden size={20} className="text-pino" />}>
          <CuentaAnimada valor={precision} sufijo=" %" />
        </Ficha>
        {penalizacion > 0 ? (
          <Ficha etiqueta="Nota" color="morado" icono={<Trophy aria-hidden size={20} className="text-morado-texto" />}>
            <span className="cifras">{nf.format(r.nota)}</span>
          </Ficha>
        ) : (
          <Ficha etiqueta="Aciertos" color="cielo" icono={<Trophy aria-hidden size={20} className="text-cielo-texto" />}>
            <span className="cifras">
              {r.aciertos}/{r.total}
            </span>
          </Ficha>
        )}
      </div>

      {penalizacion > 0 && (
        <p className="-mt-2 text-center text-sm text-pizarra">
          Nota sobre 10 con penalización: cada fallo resta{" "}
          {penalizacion > 0.33 && penalizacion < 0.34 ? "un tercio" : nf.format(penalizacion)} de acierto. {r.aciertos}{" "}
          aciertos, {r.fallos} fallos y {r.enBlanco} en blanco.
        </p>
      )}

      {antes}

      <div className="flex flex-col gap-3">{acciones}</div>

      {temas.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-xl font-black">Para repasar</h2>
          <ul className="tarjeta divide-y-2 divide-filete">
            {temas.slice(0, 5).map((t) => (
              <li key={t.etiqueta} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="line-clamp-2 leading-snug font-semibold">{t.etiqueta}</span>
                <span className="cifras shrink-0 rounded-full bg-teja-suave px-2.5 py-1 text-sm font-extrabold text-teja">
                  {t.aciertos}/{t.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
