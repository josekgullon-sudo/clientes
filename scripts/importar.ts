/**
 * Sube a Supabase el catálogo (oposiciones, temas, leyes) y las preguntas `validada`.
 * Las `retirada` se actualizan para que dejen de salir. Los borradores no se suben.
 *
 *   npm run preguntas:importar
 *   npm run preguntas:importar -- --incluir-borradores   (solo contra Supabase local)
 *
 * Necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (lee .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { cargarLeyes, cargarOposiciones, cargarPreguntas, cargarPublicas } from "./lib/cargar";

process.loadEnvFile?.(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const esLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url);
const incluirBorradores = process.argv.includes("--incluir-borradores");
if (incluirBorradores && !esLocal) {
  console.error("--incluir-borradores solo se permite contra Supabase local");
  process.exit(1);
}

const db = createClient(url, clave, { auth: { persistSession: false } });

function comprobar<T>(r: { data: T | null; error: { message: string } | null }, que: string): T {
  if (r.error || r.data === null) {
    console.error(`Error al importar ${que}: ${r.error?.message ?? "sin datos"}`);
    process.exit(1);
  }
  return r.data;
}

function sinError(r: { error: { message: string } | null }, que: string) {
  if (r.error) {
    console.error(`Error al importar ${que}: ${r.error.message}`);
    process.exit(1);
  }
}

async function main() {
  const leyes = cargarLeyes();
  const leyesDb = comprobar(
    await db
      .from("leyes")
      .upsert(
        leyes.map(({ slug, nombre, nombre_corto, fecha_version_boe }) => ({
          slug,
          nombre,
          nombre_corto,
          fecha_version_boe,
        })),
        { onConflict: "slug" },
      )
      .select("id, slug"),
    "leyes",
  );
  const idLey = new Map(leyesDb.map((l) => [l.slug, l.id]));

  const idOposicion = new Map<string, string>();
  const idTema = new Map<string, string>(); // "aux-age#19" -> uuid
  for (const o of cargarOposiciones()) {
    const [fila] = comprobar(
      await db
        .from("oposiciones")
        .upsert(
          { slug: o.slug, nombre: o.nombre, activa: o.activa, formato_simulacro: o.formato_simulacro },
          { onConflict: "slug" },
        )
        .select("id"),
      `oposición ${o.slug}`,
    );
    idOposicion.set(o.slug, fila.id);
    const temas = comprobar(
      await db
        .from("temas")
        .upsert(
          o.temas.map((t) => ({ oposicion_id: fila.id, ...t })),
          { onConflict: "oposicion_id,numero" },
        )
        .select("id, numero"),
      `temas de ${o.slug}`,
    );
    for (const t of temas) idTema.set(`${o.slug}#${t.numero}`, t.id);
  }

  const estados = incluirBorradores ? ["validada", "retirada", "borrador"] : ["validada", "retirada"];
  const preguntas = cargarPreguntas().filter((p) => estados.includes(p.estado));

  const filas = preguntas.map((p) => ({
    id: p.id,
    ley_id: p.ley ? idLey.get(p.ley) : null,
    articulo: p.articulo,
    enunciado: p.enunciado,
    opciones: p.opciones,
    correcta: p.correcta,
    explicacion: p.explicacion,
    dificultad: p.dificultad,
    fecha_version_boe: p.fecha_version_boe,
    // En local, los borradores se suben como validados para poder probar la web.
    estado: p.estado === "borrador" ? "validada" : p.estado,
    actualizada_en: new Date().toISOString(),
  }));
  for (let i = 0; i < filas.length; i += 500) {
    sinError(await db.from("preguntas").upsert(filas.slice(i, i + 500)), "preguntas");
  }

  const relaciones = preguntas.flatMap((p) =>
    Object.entries(p.temas).map(([opo, num]) => ({
      pregunta_id: p.id,
      oposicion_id: idOposicion.get(opo)!,
      tema_id: idTema.get(`${opo}#${num}`)!,
    })),
  );
  if (relaciones.length) {
    sinError(
      await db.from("preguntas_oposiciones").upsert(relaciones, { onConflict: "pregunta_id,oposicion_id" }),
      "relaciones pregunta-oposición",
    );
  }

  const subidas = new Set(preguntas.filter((p) => p.estado !== "retirada").map((p) => p.id));
  sinError(await db.from("selecciones_publicas").delete().neq("seleccion", ""), "selecciones públicas");
  const publicas = Object.entries(cargarPublicas()).flatMap(([seleccion, ids]) =>
    ids.filter((id) => subidas.has(id)).map((pregunta_id, orden) => ({ seleccion, pregunta_id, orden })),
  );
  if (publicas.length) sinError(await db.from("selecciones_publicas").insert(publicas), "selecciones públicas");

  const cuenta = (e: string) => preguntas.filter((p) => p.estado === e).length;
  console.log(
    `Importado: ${leyes.length} leyes, ${idOposicion.size} oposiciones, ${idTema.size} temas, ` +
      `${cuenta("validada")} validadas, ${cuenta("retirada")} retiradas` +
      (incluirBorradores ? `, ${cuenta("borrador")} borradores (solo local)` : "") +
      `, ${publicas.length} preguntas públicas.`,
  );
}

main();
