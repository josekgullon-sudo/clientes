/**
 * Genera SQL listo para pegar en el SQL Editor de Supabase, sin claves:
 * el mismo catálogo y las mismas preguntas `validada` que `preguntas:importar`.
 * Usa slugs y números de tema en vez de ids, así sirve en cualquier proyecto.
 *
 *   npm run preguntas:sql      # escribe supabase/produccion/02-preguntas.sql
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, cargarLeyes, cargarOposiciones, cargarPreguntas, cargarPublicas } from "./lib/cargar";

const t = (v: string | null | undefined) => (v == null ? "null" : `'${v.replaceAll("'", "''")}'`);
const arr = (xs: string[]) => `array[${xs.map(t).join(", ")}]::text[]`;

const out: string[] = [
  "-- Catálogo y preguntas validadas de Oposiciones Claras.",
  "-- Generado con `npm run preguntas:sql`. Se puede ejecutar varias veces: actualiza lo que ya existe.",
  "begin;",
  "",
];

for (const l of cargarLeyes()) {
  out.push(
    `insert into leyes (slug, nombre, nombre_corto, fecha_version_boe) values (${t(l.slug)}, ${t(l.nombre)}, ${t(l.nombre_corto)}, ${t(l.fecha_version_boe)}) ` +
      `on conflict (slug) do update set nombre = excluded.nombre, nombre_corto = excluded.nombre_corto, fecha_version_boe = excluded.fecha_version_boe;`,
  );
}
out.push("");

for (const o of cargarOposiciones()) {
  out.push(
    `insert into oposiciones (slug, nombre, activa, formato_simulacro) values (${t(o.slug)}, ${t(o.nombre)}, ${o.activa}, ${t(JSON.stringify(o.formato_simulacro))}::jsonb) ` +
      `on conflict (slug) do update set nombre = excluded.nombre, activa = excluded.activa, formato_simulacro = excluded.formato_simulacro;`,
  );
  for (const tema of o.temas) {
    out.push(
      `insert into temas (oposicion_id, numero, titulo, bloque) select id, ${tema.numero}, ${t(tema.titulo)}, ${t(tema.bloque)} from oposiciones where slug = ${t(o.slug)} ` +
        `on conflict (oposicion_id, numero) do update set titulo = excluded.titulo, bloque = excluded.bloque;`,
    );
  }
}
out.push("");

const preguntas = cargarPreguntas().filter((p) => p.estado === "validada" || p.estado === "retirada");
for (const p of preguntas) {
  out.push(
    `insert into preguntas (id, ley_id, articulo, enunciado, opciones, correcta, explicacion, dificultad, fecha_version_boe, estado, actualizada_en) values (` +
      `${t(p.id)}, ${p.ley ? `(select id from leyes where slug = ${t(p.ley)})` : "null"}, ${t(p.articulo)}, ${t(p.enunciado)}, ${arr(p.opciones)}, ` +
      `${p.correcta}, ${t(p.explicacion)}, ${p.dificultad}, ${t(p.fecha_version_boe)}, ${t(p.estado)}, now()) ` +
      `on conflict (id) do update set ley_id = excluded.ley_id, articulo = excluded.articulo, enunciado = excluded.enunciado, opciones = excluded.opciones, ` +
      `correcta = excluded.correcta, explicacion = excluded.explicacion, dificultad = excluded.dificultad, fecha_version_boe = excluded.fecha_version_boe, ` +
      `estado = excluded.estado, actualizada_en = now();`,
  );
  for (const [opo, num] of Object.entries(p.temas)) {
    out.push(
      `insert into preguntas_oposiciones (pregunta_id, oposicion_id, tema_id) select ${t(p.id)}, o.id, te.id from oposiciones o join temas te on te.oposicion_id = o.id and te.numero = ${num} where o.slug = ${t(opo)} ` +
        `on conflict (pregunta_id, oposicion_id) do update set tema_id = excluded.tema_id;`,
    );
  }
}
out.push("");

const subidas = new Set(preguntas.filter((p) => p.estado === "validada").map((p) => p.id));
out.push("delete from selecciones_publicas;");
let publicas = 0;
for (const [seleccion, ids] of Object.entries(cargarPublicas())) {
  ids
    .filter((id) => subidas.has(id))
    .forEach((id, orden) => {
      publicas++;
      out.push(`insert into selecciones_publicas (seleccion, pregunta_id, orden) values (${t(seleccion)}, ${t(id)}, ${orden});`);
    });
}

out.push("", "commit;", "");

const dir = join(RAIZ, "supabase", "produccion");
mkdirSync(dir, { recursive: true });
const destino = join(dir, "02-preguntas.sql");
writeFileSync(destino, out.join("\n"));
console.log(`${subidas.size} preguntas validadas y ${publicas} públicas en ${destino}`);
