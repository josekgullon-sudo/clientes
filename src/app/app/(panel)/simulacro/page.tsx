import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Boton } from "@/components/boton";
import { oposicionActual, usuarioActual } from "@/lib/datos/usuario";
import { crearTest } from "../../acciones";

export const metadata: Metadata = { title: "Simulacro" };

export default async function Simulacro() {
  const { suscrito } = await usuarioActual();
  if (!suscrito) redirect("/suscripcion");
  const opo = await oposicionActual();
  const f = opo.formato_simulacro;
  const total = f.partes.reduce((s, p) => s + p.preguntas, 0);
  const tercio = f.penalizacion > 0.33 && f.penalizacion < 0.34;

  return (
    <div className="max-w-lectura">
      <h1 className="font-serif text-[2rem] leading-tight font-semibold">Simulacro de examen</h1>
      <p className="mt-2 font-serif text-[1.125rem]">Como el día del examen: con tiempo y sin ver la corrección hasta el final.</p>

      <dl className="mt-6 border-t border-filete">
        {[
          ["Preguntas", `${total} (${f.partes.map((p) => `${p.preguntas} del bloque ${p.bloque}`).join(" y ")})`],
          ["Tiempo", `${f.minutos} minutos`],
          ["Penalización", tercio ? "Cada fallo resta un tercio de acierto" : `Cada fallo resta ${f.penalizacion}`],
          ["En blanco", "No suman ni restan"],
        ].map(([dt, dd]) => (
          <div key={dt} className="flex justify-between gap-4 border-b border-filete py-3">
            <dt className="font-semibold">{dt}</dt>
            <dd className="text-right">{dd}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[0.95rem] text-pizarra">
        No incluye la parte psicotécnica del examen; el tiempo es proporcional a las preguntas.
      </p>

      <form action={crearTest} className="mt-8">
        <input type="hidden" name="modo" value="simulacro" />
        <Boton type="submit" ancho>
          Empezar simulacro
        </Boton>
      </form>
      <p className="mt-2 text-[0.95rem] text-pizarra">El tiempo empieza a contar al pulsar.</p>
    </div>
  );
}
