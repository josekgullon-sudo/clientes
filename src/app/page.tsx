import Link from "next/link";
import { EnlaceBoton } from "@/components/boton";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { Explicacion } from "@/components/test/explicacion";
import { PRECIOS, eur } from "@/lib/sitio";
import { LETRAS, type PreguntaTest } from "@/lib/test/tipos";

const ejemplo: PreguntaTest = {
  id: "ejemplo",
  enunciado:
    "Cuando la norma reguladora de un procedimiento no fija el plazo máximo para resolver, ¿cuál es ese plazo?",
  opciones: ["Un mes", "Tres meses", "Seis meses", "Dos meses"],
  correcta: 1,
  explicacion:
    "El artículo 21.3 lo resuelve: «Cuando las normas reguladoras de los procedimientos no fijen el plazo máximo, éste será de tres meses».",
  articulo: "21.3",
  ley: "Ley 39/2015",
  tema: null,
};

const incluye = [
  { titulo: "Test por tema o mezclando temas", texto: "Elige qué estudiar y cuántas preguntas. Primero salen las que no has visto." },
  { titulo: "Repaso de tus fallos", texto: "Las preguntas que fallas vuelven hasta que las aciertas." },
  { titulo: "Simulacros con el formato real", texto: "Mismo número de preguntas, tiempo y penalización por error que el examen." },
  { titulo: "Tu progreso por tema", texto: "Ves de un vistazo qué temas dominas y cuáles necesitan repaso." },
];

const leyesGratis = [
  { href: "/test/constitucion", texto: "Test de la Constitución" },
  { href: "/test/ley-39-2015", texto: "Test de la Ley 39/2015" },
];

export default function Inicio() {
  const ahorro = Math.round((1 - PRECIOS.anual / (PRECIOS.mensual * 12)) * 100);
  return (
    <>
      <Cabecera />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 pt-10 pb-12 md:grid md:grid-cols-[1.1fr_1fr] md:gap-16 md:pt-20">
          <div>
            <p className="text-[0.95rem] font-semibold text-pizarra">Auxiliar Administrativo del Estado</p>
            <h1 className="mt-2 max-w-lectura font-serif text-[2.125rem] leading-[1.15] font-semibold md:text-[3rem]">
              Estudia con test que te explican cada respuesta.
            </h1>
            <p className="mt-4 max-w-lectura font-serif text-[1.125rem] leading-relaxed">
              Cada pregunta trae la explicación y el <span className="subrayado">artículo exacto de la ley</span>. Sabes
              por qué aciertas y por qué fallas.
            </p>
            <div className="mt-7 max-w-sm">
              <EnlaceBoton href="/demo" ancho>
                Hacer un test de 10 preguntas
              </EnlaceBoton>
              <p className="mt-2 text-[0.95rem] text-pizarra">Sin registro. Unos 5 minutos.</p>
            </div>
          </div>

          <figure className="mt-12 border-t border-filete pt-6 md:mt-2 md:border-t-0 md:border-l md:pt-0 md:pl-10">
            <figcaption className="text-[0.95rem] font-semibold text-pizarra">Así se corrige cada pregunta</figcaption>
            <p className="mt-3 font-serif text-[1.0625rem] leading-relaxed font-medium">{ejemplo.enunciado}</p>
            <ul className="mt-3 flex flex-col gap-1.5" aria-label="Opciones">
              {ejemplo.opciones.map((o, i) => (
                <li
                  key={o}
                  className={`flex gap-2 rounded-md px-2 py-1.5 ${i === ejemplo.correcta ? "bg-pino-suave font-semibold" : "text-pizarra"}`}
                >
                  <span className="w-5 font-bold">{LETRAS[i]}</span>
                  <span className="flex-1">{o}</span>
                  {i === ejemplo.correcta && <span aria-label="correcta">✓</span>}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Explicacion pregunta={ejemplo} respuesta={ejemplo.correcta} titular={false} />
            </div>
          </figure>
        </section>

        <section aria-labelledby="incluye" className="border-t border-filete">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 id="incluye" className="font-serif text-[1.625rem] font-semibold">
              Qué incluye
            </h2>
            <ol className="mt-4 md:grid md:grid-cols-2 md:gap-x-12">
              {incluye.map((x, i) => (
                <li key={x.titulo} className="flex gap-4 border-b border-filete py-4">
                  <span className="font-serif text-xl text-pizarra tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-semibold">{x.titulo}</h3>
                    <p className="mt-1 text-pizarra">{x.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="precio" className="border-t border-filete bg-papel-hundido">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 id="precio" className="font-serif text-[1.625rem] font-semibold">
              Precio
            </h2>
            <p className="mt-2 max-w-lectura">Todo el temario, sin permanencia. Cancelas cuando quieras desde tu cuenta.</p>
            <dl className="mt-5 max-w-md">
              <div className="flex items-baseline justify-between border-b border-filete py-3">
                <dt className="font-semibold">Mensual</dt>
                <dd>
                  <span className="font-serif text-2xl font-semibold">{eur.format(PRECIOS.mensual)}</span> /mes
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-filete py-3">
                <dt>
                  <span className="font-semibold">Anual</span>{" "}
                  <span className="subrayado text-[0.9rem] font-semibold">ahorras un {ahorro} %</span>
                </dt>
                <dd>
                  <span className="font-serif text-2xl font-semibold">{eur.format(PRECIOS.anual)}</span> /año
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[0.9rem] text-pizarra">IVA incluido.</p>
            <div className="mt-6 max-w-sm">
              <EnlaceBoton href="/entrar?registro=1" ancho>
                Empezar
              </EnlaceBoton>
            </div>
          </div>
        </section>

        <section aria-labelledby="gratis" className="border-t border-filete">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 id="gratis" className="font-serif text-[1.625rem] font-semibold">
              Test gratis por ley
            </h2>
            <p className="mt-2 max-w-lectura">10 preguntas de cada ley, con su corrección. Sin registro.</p>
            <ul className="mt-4 max-w-md">
              {leyesGratis.map((l) => (
                <li key={l.href} className="border-b border-filete">
                  <Link href={l.href} className="flex min-h-12 items-center justify-between py-2 font-semibold hover:underline">
                    {l.texto} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Pie />
    </>
  );
}
