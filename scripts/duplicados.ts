/**
 * Detecta preguntas casi iguales comparando enunciado + respuesta correcta
 * con similitud de Jaccard sobre trigramas de palabras normalizadas.
 *
 *   npm run preguntas:duplicados [-- --umbral 0.6]
 */
import { cargarPreguntas } from "./lib/cargar";

const i = process.argv.indexOf("--umbral");
const UMBRAL = i > -1 ? Number(process.argv[i + 1]) : 0.55;

const VACIAS = new Set(
  "el la los las un una unos unas de del al a en y o que se por para con su sus es son lo según cuál qué cuándo".split(" "),
);

function normalizar(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ ]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !VACIAS.has(w));
}

function trigramas(palabras: string[]) {
  const s = new Set<string>();
  for (let k = 0; k < palabras.length - 2; k++) s.add(palabras.slice(k, k + 3).join(" "));
  if (palabras.length < 3) s.add(palabras.join(" "));
  return s;
}

function jaccard(a: Set<string>, b: Set<string>) {
  let comun = 0;
  for (const x of a) if (b.has(x)) comun++;
  return comun / (a.size + b.size - comun || 1);
}

const preguntas = cargarPreguntas().filter((p) => p.estado !== "retirada");
const huellas = preguntas.map((p) => trigramas(normalizar(`${p.enunciado} ${p.opciones[p.correcta]}`)));

const pares: [number, string, string][] = [];
for (let a = 0; a < preguntas.length; a++) {
  for (let b = a + 1; b < preguntas.length; b++) {
    const s = jaccard(huellas[a], huellas[b]);
    if (s >= UMBRAL) pares.push([s, preguntas[a].id, preguntas[b].id]);
  }
}

pares.sort((x, y) => y[0] - x[0]);
for (const [s, a, b] of pares) console.log(`${s.toFixed(2)}  ${a}  ~  ${b}`);
console.log(`\n${preguntas.length} preguntas comparadas · ${pares.length} pares por encima de ${UMBRAL}`);
