import { z } from "zod";

/** Esquema de los archivos de `/preguntas`. Lo comparten la web y los scripts. */

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "solo minúsculas, números y guiones");
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "formato AAAA-MM-DD");

export const estadosPregunta = ["borrador", "validada", "retirada"] as const;

export const esquemaPregunta = z
  .object({
    id: slug,
    /** Slug de `datos/leyes.json`. `null` para ofimática. */
    ley: slug.nullable(),
    /** Referencia exacta: "21.3", "47.1.a", o la sección de la documentación de Microsoft. */
    articulo: z.string().trim().min(1),
    /** Documentación oficial usada cuando no hay ley (ofimática). */
    fuente: z.string().url().optional(),
    enunciado: z.string().trim().min(15),
    opciones: z.tuple([
      z.string().trim().min(1),
      z.string().trim().min(1),
      z.string().trim().min(1),
      z.string().trim().min(1),
    ]),
    /** Índice de la opción correcta (0 = A). */
    correcta: z.number().int().min(0).max(3),
    explicacion: z.string().trim().min(30),
    dificultad: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    fecha_version_boe: fecha.nullable(),
    estado: z.enum(estadosPregunta),
    /** Tema de cada oposición: { "aux-age": 19 }. */
    temas: z.record(slug, z.number().int().positive()).refine((t) => Object.keys(t).length > 0, {
      message: "asigna al menos una oposición",
    }),
  })
  .superRefine((p, ctx) => {
    const normal = p.opciones.map((o) => o.toLowerCase().replace(/\s+/g, " ").trim());
    if (new Set(normal).size !== 4) {
      ctx.addIssue({ code: "custom", path: ["opciones"], message: "hay opciones repetidas" });
    }
    if (p.ley === null && !p.fuente) {
      ctx.addIssue({ code: "custom", path: ["fuente"], message: "sin ley, indica la fuente oficial" });
    }
  });

export const esquemaArchivo = z.object({
  descripcion: z.string().optional(),
  preguntas: z.array(esquemaPregunta).min(1),
});

export type Pregunta = z.infer<typeof esquemaPregunta>;
export type ArchivoPreguntas = z.infer<typeof esquemaArchivo>;

export const esquemaLey = z.object({
  slug,
  nombre: z.string(),
  nombre_corto: z.string(),
  fecha_version_boe: fecha.nullable(),
  /** Archivo del texto consolidado en `/fuentes`. */
  fuente: z.string().nullable(),
});

export const esquemaOposicion = z.object({
  slug,
  nombre: z.string(),
  activa: z.boolean(),
  verificado: z.boolean(),
  formato_simulacro: z.object({
    minutos: z.number().int().positive(),
    penalizacion: z.number().min(0).max(1),
    partes: z.array(z.object({ bloque: z.string(), preguntas: z.number().int().positive() })),
    nota: z.string().optional(),
  }),
  temas: z.array(
    z.object({ numero: z.number().int().positive(), bloque: z.string(), titulo: z.string() }),
  ),
});

export type Ley = z.infer<typeof esquemaLey>;
export type Oposicion = z.infer<typeof esquemaOposicion>;
