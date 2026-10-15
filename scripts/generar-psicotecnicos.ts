/**
 * Genera los psicotécnicos del Auxiliar (bloque III, temas 29 a 32) en /preguntas.
 * Las series, el cálculo, los plazos, los horarios y demás se calculan por programa, así que la
 * respuesta correcta sale de la cuenta; la parte verbal está escrita a mano en psicotecnicos-verbal.ts.
 * Con la misma semilla sale siempre lo mismo.
 *
 *   npx tsx scripts/generar-psicotecnicos.ts            # escribe preguntas/psicotecnicos-*.json en «borrador»
 *   npx tsx scripts/generar-psicotecnicos.ts --validadas # las deja en «validada» (tras revisarlas)
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { crearAzar, type Borrador } from "./lib/psicotecnicos-base";
import { codificacion, calendario, ordenDePersonas, problemaLogico, reloj, serieDeLetras, silogismo } from "./lib/psicotecnicos-logico";
import { comparaCodigos, horario, letraDni, ordenAlfabetico, ordenNumerico, plazo } from "./lib/psicotecnicos-administrativo";
import { FAMILIAS_SERIES, fracciones, media, operacionesCombinadas, porcentaje, rebajaOAumento, reglaDeTres, reparto, seriesNumericas } from "./lib/psicotecnicos-numerico";
import { verbales } from "./lib/psicotecnicos-verbal";
import { DIR_PREGUNTAS } from "./lib/cargar";

const ESTADO = process.argv.includes("--validadas") ? "validada" : "borrador";
const MAXIMO = 30;

type Azar = ReturnType<typeof crearAzar>;

/** Genera `n` preguntas distintas con la función dada; reintenta si sale repetida o mal formada. */
function varias(azar: Azar, n: number, gen: (i: number) => Borrador, vistas: Set<string>): Borrador[] {
  const salida: Borrador[] = [];
  for (let i = 0; i < n; i++) {
    for (let intento = 0; ; intento++) {
      if (intento > 300) throw new Error(`No se consigue una pregunta distinta (${i})`);
      let b: Borrador;
      try {
        b = gen(i);
      } catch {
        continue;
      }
      const clave = `${b.enunciado}|${b.correcta}`;
      if (vistas.has(clave) || b.otras.length !== 3) continue;
      vistas.add(clave);
      salida.push(b);
      break;
    }
  }
  void azar;
  return salida;
}

function comprobar(b: Borrador) {
  const todas = [b.correcta, ...b.otras].map((o) => o.trim().toLowerCase().replace(/\s+/g, " "));
  if (new Set(todas).size !== 4) throw new Error(`Opciones repetidas: ${b.enunciado} → ${[b.correcta, ...b.otras].join(" | ")}`);
  if (b.enunciado.length < 15) throw new Error(`Enunciado corto: ${b.enunciado}`);
  if (b.explicacion.length < 30) throw new Error(`Explicación corta: ${b.enunciado}`);
}

function escribir(nombre: string, prefijo: string, descripcion: string, lista: Borrador[], azar: Azar) {
  const trozos = Math.ceil(lista.length / MAXIMO);
  // Reparto por trozos con la misma mezcla de dificultades en cada uno.
  const ordenadas = [...azar.shuffle(lista)].sort((a, b) => a.dificultad - b.dificultad);
  const porTrozo: Borrador[][] = Array.from({ length: trozos }, () => []);
  ordenadas.forEach((b, i) => porTrozo[i % trozos].push(b));
  let n = 0;
  const resumen: string[] = [];
  porTrozo.forEach((grupo, k) => {
    const mezcladas = azar.shuffle(grupo);
    // Posición de la correcta repartida a partes iguales.
    const posiciones = azar.shuffle(mezcladas.map((_, i) => i % 4));
    const preguntas = mezcladas.map((b, i) => {
      comprobar(b);
      const pos = posiciones[i];
      const resto = azar.shuffle(b.otras);
      const opciones = [...resto];
      opciones.splice(pos, 0, b.correcta);
      n++;
      return {
        id: `${prefijo}-${String(n).padStart(3, "0")}`,
        ley: "psicotecnico",
        articulo: b.articulo,
        enunciado: b.enunciado,
        opciones,
        correcta: pos,
        explicacion: b.explicacion,
        dificultad: b.dificultad,
        fecha_version_boe: null,
        estado: ESTADO,
        temas: { "aux-age": b.tema },
      };
    });
    const archivo = `psicotecnicos-${nombre}-${k + 1}.json`;
    writeFileSync(join(DIR_PREGUNTAS, archivo), `${JSON.stringify({ descripcion, preguntas }, null, 2)}\n`);
    const dif = [1, 2, 3].map((d) => preguntas.filter((p) => p.dificultad === d).length).join("/");
    const pos = [0, 1, 2, 3].map((i) => preguntas.filter((p) => p.correcta === i).length).join("/");
    resumen.push(`${archivo}: ${preguntas.length} preguntas · dificultad ${dif} · correcta ${pos}`);
  });
  console.log(resumen.join("\n"));
}

// ———————— Aptitud numérica (tema 29) ————————
{
  const azar = crearAzar(2910);
  const vistas = new Set<string>();
  const conteo: Record<string, number> = {
    aritmetica: 3, decreciente: 2, geometrica: 4, "geometrica-decreciente": 2, alterna: 5, diferencias: 5,
    cuadrados: 3, "cuadrados-mas": 2, cubos: 2, mixta: 3, fibonacci: 3, primos: 1, factoriales: 1,
  };
  const lista: Borrador[] = [];
  for (const f of FAMILIAS_SERIES) lista.push(...varias(azar, conteo[f], () => seriesNumericas(azar, f), vistas));
  lista.push(...varias(azar, 5, () => porcentaje(azar), vistas));
  lista.push(...varias(azar, 4, () => rebajaOAumento(azar), vistas));
  lista.push(...varias(azar, 4, () => reglaDeTres(azar), vistas));
  lista.push(...varias(azar, 4, () => fracciones(azar), vistas));
  lista.push(...varias(azar, 3, () => operacionesCombinadas(azar), vistas));
  lista.push(...varias(azar, 2, () => media(azar), vistas));
  lista.push(...varias(azar, 2, () => reparto(azar), vistas));
  escribir("numerica", "psn", "Psicotécnicos de aptitud numérica: series de números y cálculo. Generados con scripts/generar-psicotecnicos.ts; la respuesta correcta sale de la cuenta.", lista, azar);
}

// ———————— Aptitud verbal (tema 30) ————————
{
  const azar = crearAzar(3010);
  escribir("verbal", "psv", "Psicotécnicos de aptitud verbal: ortografía, uso de palabras, gramática, sinónimos, antónimos y analogías. Escritos a mano.", verbales(), azar);
}

// ———————— Aptitud administrativa (tema 31) ————————
{
  const azar = crearAzar(3110);
  const vistas = new Set<string>();
  const lista: Borrador[] = [];
  lista.push(...varias(azar, 11, (i) => ordenAlfabetico(azar, i), vistas));
  lista.push(...varias(azar, 7, () => comparaCodigos(azar), vistas));
  lista.push(...varias(azar, 4, () => letraDni(azar), vistas));
  lista.push(...varias(azar, 8, (i) => plazo(azar, i), vistas));
  lista.push(...varias(azar, 6, (i) => horario(azar, i), vistas));
  lista.push(...varias(azar, 4, (i) => ordenNumerico(azar, i), vistas));
  escribir("administrativa", "psa", "Psicotécnicos de aptitud administrativa: ordenar, comparar y comprobar datos, plazos y horarios. Generados con scripts/generar-psicotecnicos.ts.", lista, azar);
}

// ———————— Razonamiento lógico (tema 32) ————————
{
  const azar = crearAzar(3210);
  const vistas = new Set<string>();
  const lista: Borrador[] = [];
  lista.push(...varias(azar, 12, () => serieDeLetras(azar), vistas));
  lista.push(...varias(azar, 8, () => ordenDePersonas(azar), vistas));
  lista.push(...varias(azar, 6, () => calendario(azar), vistas));
  lista.push(...varias(azar, 4, () => reloj(azar), vistas));
  lista.push(...varias(azar, 6, (i) => silogismo(azar, i), vistas));
  lista.push(...varias(azar, 6, (i) => problemaLogico(azar, i), vistas));
  lista.push(...varias(azar, 6, (i) => codificacion(azar, i), vistas));
  escribir("logica", "psl", "Psicotécnicos de razonamiento lógico: series de letras, orden, calendario, reloj, silogismos y problemas. Generados con scripts/generar-psicotecnicos.ts.", lista, azar);
}
