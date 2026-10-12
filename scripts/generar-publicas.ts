/**
 * Regenera preguntas/publicas.json: la demo fija y 10 ids estables por ley y por tema.
 * Las páginas públicas rotan cada semana desde el banco; este archivo alimenta la importación.
 *
 *   npx tsx scripts/generar-publicas.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { slugTema } from "../src/lib/seo/seleccion";
import { DIR_PREGUNTAS, cargarOposiciones, cargarPreguntas, cargarPublicas } from "./lib/cargar";

const demo = cargarPublicas().demo ?? [];
const validadas = cargarPreguntas().filter((p) => p.estado === "validada");
const porLey = new Map<string, string[]>();
const porTema = new Map<number, string[]>();

for (const p of validadas) {
  if (p.ley) {
    const lista = porLey.get(p.ley) ?? [];
    lista.push(p.id);
    porLey.set(p.ley, lista);
  }
  const n = p.temas["aux-age"];
  if (n) {
    const lista = porTema.get(n) ?? [];
    lista.push(p.id);
    porTema.set(n, lista);
  }
}

const salida: Record<string, string[]> = { demo };
for (const [ley, ids] of [...porLey.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  salida[ley] = [...ids].sort().slice(0, 10);
}
const temas = cargarOposiciones()[0].temas;
for (const t of temas) {
  const ids = porTema.get(t.numero);
  if (!ids?.length) continue;
  salida[slugTema(t.numero, t.titulo)] = [...ids].sort().slice(0, 10);
}

writeFileSync(join(DIR_PREGUNTAS, "publicas.json"), `${JSON.stringify(salida, null, 2)}\n`);
console.log(`publicas.json: ${Object.keys(salida).length} selecciones`);
