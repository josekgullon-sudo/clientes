import { BookOpen, Check, Flame, X } from "lucide-react";

const opciones = [
  { l: "A", t: "Un mes", e: "fallada" },
  { l: "B", t: "Tres meses", e: "correcta" },
  { l: "C", t: "Seis meses", e: "" },
  { l: "D", t: "Dos meses", e: "" },
];

/**
 * Maqueta estática de la pantalla de corrección en un móvil.
 * Usa los mismos colores que la app para enseñar el producto tal cual es.
 */
export function MaquetaMovil() {
  return (
    <div
      className="relative mx-auto w-[min(100%,20rem)] rounded-[2.75rem] border border-black/20 bg-[#1b2622] p-2.5 shadow-alta"
      role="img"
      aria-label="Ejemplo de pregunta corregida: la respuesta correcta en verde, la tuya en rojo y la explicación con el artículo de la ley"
    >
      <div className="overflow-hidden rounded-[2.25rem] bg-papel" aria-hidden="true">
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-3">
          <X size={16} className="text-pizarra" />
          <div className="h-2 flex-1 rounded-full bg-papel-hundido">
            <div className="h-full w-[40%] rounded-full bg-pino" />
          </div>
          <span className="flex items-center gap-0.5 text-[0.7rem] font-extrabold text-teja">
            <Flame size={12} /> 12
          </span>
        </div>
        <div className="px-4">
          <p className="font-serif text-[0.95rem] leading-snug font-medium">
            Si la norma no fija el plazo máximo para resolver, ¿cuál es?
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            {opciones.map((o) => (
              <div
                key={o.l}
                className={`flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-[0.8rem] font-medium ${
                  o.e === "correcta"
                    ? "border-pino bg-pino-suave"
                    : o.e === "fallada"
                      ? "border-teja bg-teja-suave"
                      : "border-filete bg-superficie opacity-70"
                }`}
              >
                <span
                  className={`grid size-5 place-items-center rounded-md text-[0.65rem] font-extrabold ${
                    o.e === "correcta"
                      ? "bg-pino-boton text-sobre-pino"
                      : o.e === "fallada"
                        ? "bg-teja text-superficie"
                        : "border border-filete text-pizarra"
                  }`}
                >
                  {o.e === "correcta" ? <Check size={11} strokeWidth={3.5} /> : o.e === "fallada" ? <X size={11} strokeWidth={3.5} /> : o.l}
                </span>
                {o.t}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-filete bg-superficie p-3">
            <p className="flex items-center gap-1 text-[0.65rem] font-bold text-pizarra">
              <BookOpen size={11} /> Por qué
            </p>
            <p className="mt-1.5 border-l-2 border-teja pl-2 font-serif text-[0.75rem] leading-snug">
              «Cuando las normas reguladoras de los procedimientos no fijen el plazo máximo, éste será de tres meses».
            </p>
            <p className="mt-2 text-[0.7rem] font-bold">
              <span className="subrayado">Art. 21.3 · Ley 39/2015</span>
            </p>
          </div>
        </div>
        <div className="mt-3 bg-teja-suave px-4 pt-2.5 pb-5">
          <p className="flex items-center gap-1.5 text-[0.8rem] font-extrabold text-teja">
            <span className="grid size-4 place-items-center rounded-full bg-teja text-superficie">
              <X size={10} strokeWidth={3.5} />
            </span>
            La correcta es la B
          </p>
          <div className="mt-2 rounded-xl bg-pino-boton py-2 text-center text-[0.8rem] font-bold text-sobre-pino">Continuar</div>
        </div>
      </div>
    </div>
  );
}
