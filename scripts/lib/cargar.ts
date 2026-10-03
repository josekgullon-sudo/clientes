import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  esquemaArchivo,
  esquemaLey,
  esquemaOposicion,
  type Pregunta,
} from "../../src/lib/preguntas/esquema";

export const RAIZ = join(import.meta.dirname, "..", "..");
export const DIR_PREGUNTAS = join(RAIZ, "preguntas");

export type ArchivoLeido =
  | { archivo: string; ok: true; preguntas: Pregunta[] }
  | { archivo: string; ok: false; errores: string[] };

export function archivosPreguntas(): string[] {
  return readdirSync(DIR_PREGUNTAS)
    .filter((f) => f.endsWith(".json") && f !== "publicas.json")
    .sort();
}

export function leerArchivo(archivo: string): ArchivoLeido {
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(join(DIR_PREGUNTAS, archivo), "utf8"));
  } catch (e) {
    return { archivo, ok: false, errores: [`JSON no válido: ${(e as Error).message}`] };
  }
  const r = esquemaArchivo.safeParse(json);
  if (!r.success) {
    return {
      archivo,
      ok: false,
      errores: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  return { archivo, ok: true, preguntas: r.data.preguntas };
}

/** Todas las preguntas válidas, con el archivo de origen. Ignora los archivos con errores. */
export function cargarPreguntas(): (Pregunta & { archivo: string })[] {
  return archivosPreguntas().flatMap((a) => {
    const r = leerArchivo(a);
    return r.ok ? r.preguntas.map((p) => ({ ...p, archivo: a })) : [];
  });
}

export function cargarLeyes() {
  return z.array(esquemaLey).parse(JSON.parse(readFileSync(join(RAIZ, "datos", "leyes.json"), "utf8")));
}

export function cargarOposiciones() {
  return z
    .array(esquemaOposicion)
    .parse(JSON.parse(readFileSync(join(RAIZ, "datos", "oposiciones.json"), "utf8")));
}

export function cargarPublicas(): Record<string, string[]> {
  return z
    .record(z.string(), z.array(z.string()))
    .parse(JSON.parse(readFileSync(join(DIR_PREGUNTAS, "publicas.json"), "utf8")));
}
