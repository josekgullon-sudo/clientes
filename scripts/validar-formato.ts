/**
 * Comprueba el esquema de cada archivo de /preguntas y reglas de calidad.
 * Errores: rompen el formato o la integridad (sale con código 1).
 * Avisos: conviene revisarlos, pero no bloquean.
 *
 *   npm run preguntas:validar
 */
import {
  archivosPreguntas,
  cargarLeyes,
  cargarOposiciones,
  cargarPublicas,
  leerArchivo,
} from "./lib/cargar";

const errores: string[] = [];
const avisos: string[] = [];

const leyes = new Set(cargarLeyes().map((l) => l.slug));
const temasPorOposicion = new Map(
  cargarOposiciones().map((o) => [o.slug, new Set(o.temas.map((t) => t.numero))]),
);
const ids = new Map<string, string>();

const PROHIBIDAS = /(todas (las anteriores )?son (correctas|ciertas|verdaderas)|ninguna (de las anteriores )?es (correcta|cierta|verdadera))/i;

for (const archivo of archivosPreguntas()) {
  const r = leerArchivo(archivo);
  if (!r.ok) {
    errores.push(...r.errores.map((e) => `${archivo}: ${e}`));
    continue;
  }
  const { preguntas } = r;

  if (!/^[a-z0-9]+(-[a-z0-9]+)*\.json$/.test(archivo)) {
    avisos.push(`${archivo}: el nombre debería ir en minúsculas y con guiones`);
  }
  if (preguntas.length < 20 || preguntas.length > 30) {
    avisos.push(`${archivo}: tiene ${preguntas.length} preguntas (lotes de 20 a 30)`);
  }

  let sinFecha = 0;
  const dif = [0, 0, 0];
  const pos = [0, 0, 0, 0];
  for (const p of preguntas) {
    const donde = `${archivo} › ${p.id}`;
    if (ids.has(p.id)) errores.push(`${donde}: id repetido (también en ${ids.get(p.id)})`);
    ids.set(p.id, archivo);

    if (p.ley !== null && !leyes.has(p.ley)) errores.push(`${donde}: ley desconocida «${p.ley}»`);
    for (const [opo, num] of Object.entries(p.temas)) {
      const temas = temasPorOposicion.get(opo);
      if (!temas) errores.push(`${donde}: oposición desconocida «${opo}»`);
      else if (!temas.has(num)) errores.push(`${donde}: «${opo}» no tiene tema ${num}`);
    }

    if (p.opciones.some((o) => PROHIBIDAS.test(o))) {
      avisos.push(`${donde}: usa «todas/ninguna son correctas»; resérvalo para casos puntuales`);
    }
    if (p.ley !== null && !/[«"“]/.test(p.explicacion)) {
      avisos.push(`${donde}: la explicación no cita el texto de la ley entre comillas`);
    }
    if (p.ley !== null && p.fecha_version_boe === null) sinFecha++;
    const largos = p.opciones.map((o) => o.length);
    if (largos[p.correcta] > 1.6 * Math.max(...largos.filter((_, i) => i !== p.correcta))) {
      avisos.push(`${donde}: la correcta es mucho más larga que el resto; se adivina`);
    }
    dif[p.dificultad - 1]++;
    pos[p.correcta]++;
  }

  if (sinFecha) avisos.push(`${archivo}: ${sinFecha} preguntas sin fecha_version_boe`);
  const n = preguntas.length;
  const objetivo = [0.4, 0.4, 0.2];
  const desvio = dif.some((d, i) => Math.abs(d / n - objetivo[i]) > 0.1);
  if (desvio) {
    avisos.push(
      `${archivo}: dificultad ${dif.map((d) => Math.round((d / n) * 100)).join("/")} % (objetivo 40/40/20)`,
    );
  }
  if (n >= 12 && pos.some((c) => c / n > 0.4)) {
    avisos.push(`${archivo}: la respuesta correcta se concentra en una letra (${pos.join("/")})`);
  }
}

for (const [seleccion, lista] of Object.entries(cargarPublicas())) {
  for (const id of lista) {
    if (!ids.has(id)) errores.push(`publicas.json › ${seleccion}: no existe la pregunta «${id}»`);
  }
}

for (const a of avisos) console.log(`aviso  ${a}`);
for (const e of errores) console.log(`ERROR  ${e}`);
console.log(`\n${ids.size} preguntas · ${errores.length} errores · ${avisos.length} avisos`);
process.exit(errores.length ? 1 : 0);
