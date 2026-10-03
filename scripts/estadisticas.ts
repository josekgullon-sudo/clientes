/**
 * Preguntas por tema, dificultad y estado.
 *
 *   npm run preguntas:estadisticas
 */
import { cargarOposiciones, cargarPreguntas } from "./lib/cargar";

const preguntas = cargarPreguntas();

function contar<T extends string | number>(lista: T[]) {
  const m = new Map<T, number>();
  for (const x of lista) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

const pct = (n: number) => `${Math.round((n / (preguntas.length || 1)) * 100)} %`;

console.log(`Total: ${preguntas.length} preguntas\n`);

console.log("Por estado");
for (const [e, n] of contar(preguntas.map((p) => p.estado))) console.log(`  ${e.padEnd(10)} ${String(n).padStart(4)}  ${pct(n)}`);

console.log("\nPor dificultad (objetivo 40/40/20)");
const nombres = { 1: "fácil", 2: "media", 3: "difícil" } as const;
for (const d of [1, 2, 3] as const) {
  const n = preguntas.filter((p) => p.dificultad === d).length;
  console.log(`  ${nombres[d].padEnd(10)} ${String(n).padStart(4)}  ${pct(n)}`);
}

console.log("\nPor ley");
for (const [l, n] of contar(preguntas.map((p) => p.ley ?? "(ofimática)"))) console.log(`  ${l.padEnd(14)} ${String(n).padStart(4)}`);

for (const o of cargarOposiciones()) {
  console.log(`\n${o.nombre} (${o.slug})`);
  console.log("  tema  total  validadas  borrador  título");
  for (const t of o.temas) {
    const delTema = preguntas.filter((p) => p.temas[o.slug] === t.numero);
    const v = delTema.filter((p) => p.estado === "validada").length;
    const b = delTema.filter((p) => p.estado === "borrador").length;
    console.log(
      `  ${String(t.numero).padStart(4)}  ${String(delTema.length).padStart(5)}  ${String(v).padStart(9)}  ${String(b).padStart(8)}  ${t.titulo.slice(0, 60)}`,
    );
  }
}
