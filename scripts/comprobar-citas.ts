/**
 * Comprueba que cada cita «entre comillas» de las explicaciones aparece literalmente en el texto
 * consolidado de su ley (/fuentes) o, en ofimática, en la página oficial descargada en /fuentes/microsoft. Ignora mayúsculas, espacios y la puntuación final; «[…]» o «...»
 * dentro de una cita separan trozos que se buscan por separado.
 *
 *   npm run preguntas:citas                 # todos los archivos
 *   npm run preguntas:citas -- archivo.json # solo esos
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, archivosPreguntas, cargarLeyes, leerArchivo } from "./lib/cargar";

const normal = (s: string) =>
  s
    .toLowerCase()
    .replace(/[“”"«»]/g, "")
    .replace(/[‐-―−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const textos = new Map<string, string>();
for (const l of cargarLeyes()) {
  if (l.fuente) textos.set(l.slug, normal(readFileSync(join(RAIZ, "fuentes", l.fuente), "utf8")));
}

// Páginas oficiales descargadas (ofimática en /fuentes/microsoft, otras webs en /fuentes/web),
// con su URL en la segunda línea.
const paginas = new Map<string, string>();
for (const carpeta of ["microsoft", "web"]) {
  const dir = join(RAIZ, "fuentes", carpeta);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".txt"))) {
    const crudo = readFileSync(join(dir, f), "utf8");
    paginas.set(crudo.split("\n")[1].trim(), normal(crudo));
  }
}

const pedidos = process.argv.slice(2).filter((a) => a.endsWith(".json"));
const archivos = pedidos.length ? pedidos.map((a) => a.replace(/^preguntas\//, "")) : archivosPreguntas();

let fallos = 0;
let citas = 0;
let sinCita = 0;
for (const archivo of archivos) {
  const r = leerArchivo(archivo);
  if (!r.ok) {
    console.log(`${archivo}: no se puede leer (${r.errores[0]})`);
    fallos++;
    continue;
  }
  for (const p of r.preguntas) {
    const texto = p.ley ? textos.get(p.ley) : p.fuente ? paginas.get(p.fuente) : undefined;
    if (!texto) {
      if (!p.ley && p.fuente) {
        fallos++;
        console.log(`${archivo} › ${p.id}: la fuente no está descargada en fuentes/microsoft ni fuentes/web: ${p.fuente}`);
      }
      continue;
    }
    const encontradas = [...p.explicacion.matchAll(/«([^»]+)»/g)].map((m) => m[1]);
    if (encontradas.length === 0) sinCita++;
    for (const cita of encontradas) {
      citas++;
      const trozos = cita
        .split(/\[…\]|\[\.\.\.\]|…|\.\.\./)
        .map((t) => normal(t).replace(/^[,;:.\s]+|[,;:.\s]+$/g, ""))
        .filter((t) => t.length >= 4);
      const falta = trozos.find((t) => !texto.includes(t));
      if (falta) {
        fallos++;
        console.log(`${archivo} › ${p.id} (${p.articulo}): no aparece en ${p.ley ?? p.fuente}: «${falta.slice(0, 90)}»`);
      }
    }
  }
}
console.log(`\n${citas} citas comprobadas, ${fallos} sin encontrar, ${sinCita} preguntas sin cita.`);
process.exit(fallos ? 1 : 0);
