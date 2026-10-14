import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Zap } from "lucide-react";
import { ClaraDice } from "@/components/mascota/bocadillo";
import { Avatar } from "@/components/ui/avatar";
import { ligaSemanal } from "@/lib/datos/estudio";
import { diasEntre, hoyMadrid } from "@/lib/seo/seleccion";

export const metadata: Metadata = { title: "Liga" };

const MEDALLAS = [
  { fondo: "#facc15", sombra: "#ca8a04", texto: "#422006" },
  { fondo: "#cbd5e1", sombra: "#94a3b8", texto: "#1e293b" },
  { fondo: "#fdba74", sombra: "#c2410c", texto: "#431407" },
];

/** Copa de la liga, dibujada a mano para la cabecera. */
function Copa() {
  return (
    <svg viewBox="0 0 80 80" className="size-20 shrink-0" aria-hidden="true">
      <path d="M22 14 h-10 q0 20 16 22" fill="none" stroke="#CA8A04" strokeWidth="6" strokeLinecap="round" />
      <path d="M58 14 h10 q0 20 -16 22" fill="none" stroke="#CA8A04" strokeWidth="6" strokeLinecap="round" />
      <path d="M20 8 h40 v14 q0 22 -20 24 q-20 -2 -20 -24z" fill="#FACC15" />
      <path d="M48 10 h8 v12 q0 14 -10 20 q6 -8 6 -20z" fill="#EAB308" />
      <rect x="35" y="45" width="10" height="12" fill="#CA8A04" />
      <rect x="24" y="56" width="32" height="10" rx="4" fill="#15803D" />
      <rect x="24" y="62" width="32" height="4" rx="2" fill="#0F5F2D" />
      <path d="M40 16 l2.6 5.4 5.9 0.8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -0.8z" fill="#fff" opacity="0.85" />
    </svg>
  );
}

export default async function Liga() {
  const liga = await ligaSemanal();
  if (!liga) {
    return (
      <ClaraDice pose="piensa">
        No hemos podido cargar la liga. Vuelve a intentarlo en un momento.
      </ClaraDice>
    );
  }
  const quedan = Math.max(0, diasEntre(hoyMadrid(), liga.fin));
  const yo = liga.filas.find((f) => f.yo);
  const conXp = (yo?.xp ?? 0) > 0;
  const pocos = liga.participantes < 4;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start xl:gap-10">
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <section
            aria-labelledby="titulo-liga"
            className="flex items-center gap-4 rounded-[1.25rem] p-5 text-white"
            style={{ background: "#c2410c", boxShadow: "0 4px 0 #9a3412" }}
          >
            <Copa />
            <div>
              <h1 id="titulo-liga" className="font-display text-[1.75rem] leading-tight font-black">
                Liga semanal
              </h1>
              <p className="font-bold opacity-95">
                {quedan === 0 ? "¡Último día! Termina esta noche." : `Termina en ${quedan} ${quedan === 1 ? "día" : "días"}.`}
              </p>
            </div>
          </section>

          <ClaraDice pose={conXp && liga.mi_posicion && liga.mi_posicion <= 3 ? "celebra" : conXp ? "feliz" : "senala"} tamano="size-20">
            {!conXp
              ? "Cada pregunta suma XP. Haz una lección y entra en la clasificación de esta semana."
              : liga.mi_posicion === 1
                ? "¡Vas en cabeza! Defiende el primer puesto."
                : liga.mi_posicion && liga.mi_posicion <= 3
                  ? "¡Estás en el podio! Un empujón más y lo tienes."
                  : "Cada lección te sube puestos. ¡Tú puedes!"}
          </ClaraDice>

        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <ol className="tarjeta divide-y-2 divide-filete overflow-hidden" aria-label="Clasificación">
            {liga.filas.map((f) => {
              const medalla = f.xp > 0 ? MEDALLAS[f.pos - 1] : undefined;
              return (
                <li
                  key={`${f.pos}-${f.alias}`}
                  className={`flex items-center gap-3 px-4 py-3 ${f.yo ? "bg-cielo-suave" : ""}`}
                  aria-current={f.yo ? "true" : undefined}
                >
                  <span
                    className="cifras grid size-8 shrink-0 place-items-center rounded-full font-display font-black"
                    style={medalla ? { background: medalla.fondo, color: medalla.texto, boxShadow: `0 3px 0 ${medalla.sombra}` } : undefined}
                  >
                    {f.pos}
                  </span>
                  <Avatar clave={f.avatar} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-extrabold">{f.alias}</span>
                      {f.yo && <span className="shrink-0 rounded-full bg-cielo-texto px-2 py-0.5 text-[0.6875rem] font-black text-superficie">TÚ</span>}
                    </span>
                    {f.racha > 0 && (
                      <span className="cifras inline-flex items-center gap-1 text-xs font-bold text-naranja-texto">
                        <Flame aria-hidden size={13} className="fill-naranja text-naranja" /> {f.racha} {f.racha === 1 ? "día" : "días"}
                      </span>
                    )}
                  </span>
                  <span className="cifras inline-flex shrink-0 items-center gap-1 font-display font-black text-oro-texto">
                    <Zap aria-hidden size={16} className="fill-subrayador text-subrayador" />
                    {f.xp} XP
                  </span>
                </li>
              );
            })}
          </ol>

          {pocos && (
            <p className="rounded-2xl bg-papel-hundido p-4 text-center text-sm font-semibold text-pizarra">
              La liga acaba de empezar y aún sois pocos. Cada semana se une más gente.
            </p>
          )}

          <p className="text-center text-sm text-pizarra">
            Solo se ven tu alias y tu avatar.{" "}
            <Link href="/app/cuenta#perfil" className="enlace">
              Cámbialos en tu perfil
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
