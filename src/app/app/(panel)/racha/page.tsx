import type { Metadata } from "next";
import { Flame, Snowflake, Trophy } from "lucide-react";
import { EnlaceBoton } from "@/components/boton";
import { ClaraDice } from "@/components/mascota/bocadillo";
import { actividadReciente, estadisticasUsuario } from "@/lib/datos/estudio";
import { hoyMadrid } from "@/lib/seo/seleccion";

export const metadata: Metadata = { title: "Tu racha" };

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const mes = new Intl.DateTimeFormat("es-ES", { month: "long", timeZone: "UTC" });

function sumarDias(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default async function Racha() {
  const [estudio, actividad] = await Promise.all([estadisticasUsuario(), actividadReciente(42)]);
  const racha = estudio?.racha_actual ?? 0;
  const maxima = estudio?.racha_maxima ?? 0;
  const protectores = estudio?.protectores ?? 0;
  const hoy = hoyMadrid();
  const hechoHoy = (estudio?.preguntas_hoy ?? 0) >= (estudio?.objetivo_diario ?? 10);

  // Cinco semanas completas, de lunes a domingo, terminando en la semana actual.
  const diaSemana = (new Date(`${hoy}T00:00:00Z`).getUTCDay() + 6) % 7;
  const inicio = sumarDias(hoy, -diaSemana - 28);
  const porDia = new Map(actividad.map((a) => [a.dia, a]));
  const celdas = Array.from({ length: 35 }, (_, i) => {
    const dia = sumarDias(inicio, i);
    return { dia, a: porDia.get(dia), futuro: dia > hoy, esHoy: dia === hoy };
  });
  const meses = [...new Set([celdas[0].dia, celdas[34].dia].map((d) => mes.format(new Date(`${d}T00:00:00Z`))))];

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="titulo-racha"
        className="relative overflow-hidden rounded-[1.25rem] px-5 py-6 text-center text-white"
        style={{ background: "linear-gradient(160deg, #ea580c, #c2410c)", boxShadow: "0 4px 0 #9a3412" }}
      >
        <Flame
          aria-hidden
          size={72}
          className={`mx-auto ${racha > 0 ? "llama fill-[#fde047] text-[#fde047]" : "text-white/60"}`}
          strokeWidth={1.8}
        />
        <h1 id="titulo-racha" className="mt-2 font-display font-black">
          <span className="cifras block text-6xl leading-none">{racha}</span>
          <span className="mt-1 block text-xl">{racha === 1 ? "día de racha" : "días de racha"}</span>
        </h1>
      </section>

      <ClaraDice pose={hechoHoy ? "celebra" : racha > 0 ? "animo" : "hola"} tamano="size-20">
        {hechoHoy
          ? "¡Hoy ya has cumplido! Tu racha está a salvo hasta mañana."
          : racha > 0
            ? "Cumple tu objetivo de hoy para que la racha siga creciendo."
            : "Cumple tu objetivo hoy y enciende tu primera llama."}
      </ClaraDice>

      <section aria-labelledby="calendario" className="tarjeta p-4">
        <h2 id="calendario" className="font-display text-lg font-black capitalize">
          {meses.join(" – ")}
        </h2>
        <div className="mt-3 grid grid-cols-7 gap-1.5 text-center" aria-hidden="true">
          {DIAS.map((d) => (
            <span key={d} className="text-xs font-black text-pizarra">
              {d}
            </span>
          ))}
        </div>
        <ol className="mt-1.5 grid grid-cols-7 gap-1.5" aria-label="Últimas cinco semanas">
          {celdas.map(({ dia, a, futuro, esHoy }) => {
            const protegido = !!a?.protector_usado;
            const cumplido = !!a?.objetivo_cumplido && !protegido;
            const algo = !cumplido && !protegido && (a?.preguntas ?? 0) > 0;
            const n = Number(dia.slice(8));
            const estado = cumplido
              ? "objetivo cumplido"
              : protegido
                ? "protector usado"
                : algo
                  ? "algo de práctica"
                  : futuro
                    ? "por llegar"
                    : "sin práctica";
            return (
              <li
                key={dia}
                aria-label={`${n} de ${mes.format(new Date(`${dia}T00:00:00Z`))}${esHoy ? " (hoy)" : ""}: ${estado}`}
                className={`cifras mx-auto grid aspect-square w-full max-w-11 place-items-center rounded-full text-sm font-extrabold ${
                  cumplido
                    ? "bg-[#c2410c] text-white"
                    : protegido
                      ? "bg-cielo-vivo text-[#082f49]"
                      : algo
                        ? "bg-naranja-suave text-naranja-texto"
                        : futuro
                          ? "text-pizarra/50"
                          : "text-pizarra"
                } ${esHoy ? "ring-3 ring-tinta ring-offset-2 ring-offset-superficie" : ""}`}
              >
                {protegido ? <Snowflake aria-hidden size={16} strokeWidth={2.6} /> : n}
              </li>
            );
          })}
        </ol>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-pizarra">
          <li className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-full bg-[#c2410c]" aria-hidden="true" /> Objetivo cumplido
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-full bg-naranja-suave ring-1 ring-naranja" aria-hidden="true" /> Algo de práctica
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-full bg-cielo-vivo" aria-hidden="true" /> Protector
          </li>
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="tarjeta flex flex-col items-center p-4 text-center">
          <Trophy aria-hidden size={28} className="text-oro-texto" />
          <p className="cifras mt-2 font-display text-2xl font-black">{maxima}</p>
          <p className="text-sm font-bold text-pizarra">Tu mejor racha</p>
        </div>
        <div className="tarjeta flex flex-col items-center p-4 text-center">
          <Snowflake aria-hidden size={28} className="text-cielo-texto" />
          <p className="cifras mt-2 font-display text-2xl font-black">{protectores}</p>
          <p className="text-sm font-bold text-pizarra">{protectores === 1 ? "Protector" : "Protectores"}</p>
        </div>
      </div>

      <section className="rounded-2xl bg-cielo-suave p-4">
        <h2 className="flex items-center gap-2 font-display font-black text-cielo-texto">
          <Snowflake aria-hidden size={18} /> ¿Para qué sirven los protectores?
        </h2>
        <p className="mt-1 text-sm font-semibold">
          Si un día no puedes estudiar, un protector congela tu racha y no la pierdes. Tienes uno cada semana; con
          Premium, más.
        </p>
      </section>

      {!hechoHoy && (
        <EnlaceBoton href="/app" ancho>
          Practicar ahora
        </EnlaceBoton>
      )}
    </div>
  );
}
