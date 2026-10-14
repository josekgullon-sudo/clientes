import type { Metadata } from "next";
import { CircleSlash, Clock, ListChecks, MinusCircle } from "lucide-react";
import { Boton } from "@/components/boton";
import { Clara } from "@/components/mascota/clara";
import { oposicionActual, usuarioActual } from "@/lib/datos/usuario";
import { crearTest } from "../../acciones";

export const metadata: Metadata = { title: "Simulacro" };

export default async function Simulacro() {
  const [{ suscrito }, opo] = await Promise.all([usuarioActual(), oposicionActual()]);
  const f = opo.formato_simulacro;
  const total = f.partes.reduce((s, p) => s + p.preguntas, 0);
  const tercio = f.penalizacion > 0.33 && f.penalizacion < 0.34;
  const soloBloqueI = f.partes.length === 1 && f.partes[0].bloque === "I";

  const datos = [
    { icono: ListChecks, valor: String(total), texto: "preguntas", detalle: f.partes.map((p) => `${p.preguntas} del bloque ${p.bloque}`).join(" y ") },
    { icono: Clock, valor: String(f.minutos), texto: "minutos", detalle: "El tiempo empieza al pulsar" },
    { icono: MinusCircle, valor: tercio ? "−⅓" : `−${f.penalizacion}`, texto: "por fallo", detalle: "Como en el examen real" },
    { icono: CircleSlash, valor: "0", texto: "en blanco", detalle: "No suman ni restan" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex items-center gap-4">
        <Clara pose="piensa" className="size-24 shrink-0" />
        <div>
          <p className="antetitulo">Modo examen</p>
          <h1 className="mt-1 font-display text-[2rem] leading-tight font-black">
            {soloBloqueI ? "Simulacro del bloque I" : "Simulacro"}
          </h1>
          <p className="mt-1 font-semibold text-pizarra">Con tiempo y sin ver la corrección hasta el final.</p>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3">
        {datos.map((d) => (
          <div key={d.texto} className="tarjeta flex flex-col p-4">
            <dt className="order-2 text-sm font-semibold">{d.texto}</dt>
            <dd className="order-1 flex items-center gap-2">
              <d.icono aria-hidden size={20} className="text-pino" />
              <span className="cifras text-3xl font-extrabold">{d.valor}</span>
            </dd>
            <dd className="order-3 mt-1 text-xs text-pizarra">{d.detalle}</dd>
          </div>
        ))}
      </dl>

      <p className="rounded-2xl bg-papel-hundido p-4 text-sm text-pizarra">
        {soloBloqueI
          ? "De momento es el simulacro del bloque I, con el tiempo proporcional al examen real (90 minutos para 110 preguntas). Cuando esté listo el bloque II, será el examen completo."
          : "No incluye la parte psicotécnica; el tiempo es proporcional a las preguntas del examen real."}
      </p>

      {!suscrito && (
        <p className="rounded-2xl bg-oro-suave p-4 text-sm text-oro-texto">
          El plan gratis incluye un simulacro de prueba. Los siguientes son de Premium.
        </p>
      )}

      <form action={crearTest}>
        <input type="hidden" name="modo" value="simulacro" />
        <Boton type="submit" ancho>
          <Clock aria-hidden size={18} /> Empezar simulacro
        </Boton>
      </form>
    </div>
  );
}
