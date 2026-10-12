import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { esquemaArchivo, esquemaLey, esquemaOposicion, type Pregunta } from "@/lib/preguntas/esquema";
import type { PreguntaTest } from "@/lib/test/tipos";
import { elegirSemana, slugTema, type RutaPublica } from "./seleccion";

export type PreguntaPublica = PreguntaTest & { dificultad: 1 | 2 | 3 };

type LeyInfo = { slug: string; nombre: string; nombreCorto: string; fecha: string | null };
type TemaInfo = { numero: number; bloque: string; titulo: string; slug: string };

export type PaginaPublica = {
  slug: string;
  tipo: "ley" | "tema" | "demo";
  titulo: string;
  h1: string;
  descripcion: string;
  ley: LeyInfo | null;
  tema: TemaInfo | null;
  preguntas: PreguntaPublica[];
  totalBanco: number;
  articulos: { articulo: string; veces: number }[];
  temasRelacionados: TemaInfo[];
  leyesRelacionadas: LeyInfo[];
  siguiente: { href: string; texto: string } | null;
  enPreparacion: boolean;
};

type Fila = Pregunta & { leyInfo: LeyInfo | null; temaInfo: TemaInfo | null };

let cache: {
  leyes: LeyInfo[];
  temas: TemaInfo[];
  filas: Fila[];
  porLey: Map<string, Fila[]>;
  porTema: Map<number, Fila[]>;
} | null = null;

function cargar() {
  if (cache) return cache;
  const raiz = process.cwd();
  const leyesJson = esquemaLey.array().parse(JSON.parse(readFileSync(join(raiz, "datos/leyes.json"), "utf8")));
  const opos = esquemaOposicion.array().parse(JSON.parse(readFileSync(join(raiz, "datos/oposiciones.json"), "utf8")));
  const opo = opos.find((o) => o.slug === "aux-age") ?? opos[0];
  const leyes: LeyInfo[] = leyesJson.map((l) => ({
    slug: l.slug,
    nombre: l.nombre,
    nombreCorto: l.nombre_corto,
    fecha: l.fecha_version_boe,
  }));
  const temas: TemaInfo[] = opo.temas.map((t) => ({
    numero: t.numero,
    bloque: t.bloque,
    titulo: t.titulo,
    slug: slugTema(t.numero, t.titulo),
  }));
  const leyPorSlug = new Map(leyes.map((l) => [l.slug, l]));
  const temaPorNumero = new Map(temas.map((t) => [t.numero, t]));
  const filas: Fila[] = [];
  for (const archivo of readdirSync(join(raiz, "preguntas")).filter((f) => f.endsWith(".json") && f !== "publicas.json")) {
    const parsed = esquemaArchivo.safeParse(JSON.parse(readFileSync(join(raiz, "preguntas", archivo), "utf8")));
    if (!parsed.success) continue;
    for (const p of parsed.data.preguntas) {
      if (p.estado !== "validada") continue;
      const numero = p.temas["aux-age"] ?? null;
      filas.push({
        ...p,
        leyInfo: p.ley ? (leyPorSlug.get(p.ley) ?? null) : null,
        temaInfo: numero ? (temaPorNumero.get(numero) ?? null) : null,
      });
    }
  }
  const porLey = new Map<string, Fila[]>();
  const porTema = new Map<number, Fila[]>();
  for (const f of filas) {
    if (f.ley) {
      const lista = porLey.get(f.ley) ?? [];
      lista.push(f);
      porLey.set(f.ley, lista);
    }
    if (f.temaInfo) {
      const lista = porTema.get(f.temaInfo.numero) ?? [];
      lista.push(f);
      porTema.set(f.temaInfo.numero, lista);
    }
  }
  cache = { leyes, temas, filas, porLey, porTema };
  return cache;
}

function aPregunta(f: Fila): PreguntaPublica {
  return {
    id: f.id,
    enunciado: f.enunciado,
    opciones: [...f.opciones],
    correcta: f.correcta,
    explicacion: f.explicacion,
    articulo: f.articulo,
    ley: f.leyInfo?.nombreCorto ?? null,
    tema: f.temaInfo ? { numero: f.temaInfo.numero, titulo: f.temaInfo.titulo } : null,
    dificultad: f.dificultad,
  };
}

function articulosDe(filas: Fila[]) {
  const cuenta = new Map<string, number>();
  for (const f of filas) cuenta.set(f.articulo, (cuenta.get(f.articulo) ?? 0) + 1);
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .slice(0, 6)
    .map(([articulo, veces]) => ({ articulo, veces }));
}

export function rutasPublicas(): RutaPublica[] {
  const { leyes, temas } = cargar();
  return [
    ...leyes.map((l) => ({ slug: l.slug, tipo: "ley" as const })),
    ...temas.map((t) => ({ slug: t.slug, tipo: "tema" as const, numero: t.numero })),
  ];
}

export function resumenBanco() {
  const { filas, temas, porTema } = cargar();
  const conPreguntas = temas.filter((t) => (porTema.get(t.numero)?.length ?? 0) > 0);
  return {
    preguntas: filas.length,
    temas: temas.length,
    temasConPreguntas: conPreguntas.length,
    temasSinPreguntas: temas.filter((t) => !porTema.get(t.numero)?.length),
  };
}

export function paginaPublica(slug: string, fecha = new Date()): PaginaPublica | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const datos = cargar();
  if (slug === "demo") {
    const ids = idsDemo();
    const porId = new Map(datos.filas.map((f) => [f.id, f]));
    const preguntas = ids.map((id) => porId.get(id)).filter((f): f is Fila => !!f).map(aPregunta);
    return {
      slug,
      tipo: "demo",
      titulo: "Test de prueba de 10 preguntas",
      h1: "Test de prueba",
      descripcion: "Prueba un test del Auxiliar Administrativo del Estado sin registrarte.",
      ley: null,
      tema: null,
      preguntas,
      totalBanco: datos.filas.length,
      articulos: [],
      temasRelacionados: [],
      leyesRelacionadas: [],
      siguiente: datos.leyes[0] ? { href: `/test/${datos.leyes[0].slug}`, texto: datos.leyes[0].nombreCorto } : null,
      enPreparacion: preguntas.length === 0,
    };
  }

  const ley = datos.leyes.find((l) => l.slug === slug);
  const tema = datos.temas.find((t) => t.slug === slug);
  if (!ley && !tema) return null;

  if (ley) {
    const filas = datos.porLey.get(ley.slug) ?? [];
    const preguntas = elegirSemana(filas, ley.slug, fecha).map(aPregunta);
    const temasRelacionados = datos.temas.filter((t) => filas.some((f) => f.temaInfo?.numero === t.numero));
    const indice = datos.leyes.findIndex((l) => l.slug === ley.slug);
    const sig = datos.leyes[(indice + 1) % datos.leyes.length];
    return {
      slug,
      tipo: "ley",
      titulo: ley.nombreCorto === "Constitución" ? "Test de la Constitución Española" : `Test de la ${ley.nombreCorto}`,
      h1: ley.nombreCorto === "Constitución" ? "Test de la Constitución Española" : `Test de la ${ley.nombreCorto}`,
      descripcion: `Preguntas gratis de la ${ley.nombre} para el Auxiliar Administrativo del Estado, con la respuesta explicada y el artículo del BOE.`,
      ley,
      tema: null,
      preguntas,
      totalBanco: filas.length,
      articulos: articulosDe(filas),
      temasRelacionados,
      leyesRelacionadas: [],
      siguiente: sig && sig.slug !== ley.slug ? { href: `/test/${sig.slug}`, texto: `Test de la ${sig.nombreCorto}` } : null,
      enPreparacion: filas.length === 0,
    };
  }

  if (!tema) return null;
  const filas = datos.porTema.get(tema.numero) ?? [];
  const preguntas = elegirSemana(filas, tema.slug, fecha).map(aPregunta);
  const leyesRelacionadas = datos.leyes.filter((l) => filas.some((f) => f.ley === l.slug));
  const indice = datos.temas.findIndex((t) => t.numero === tema.numero);
  const sig = datos.temas[(indice + 1) % datos.temas.length];
  return {
    slug,
    tipo: "tema",
    titulo: `Tema ${tema.numero}. ${tema.titulo}`,
    h1: `Test del tema ${tema.numero}: ${tema.titulo}`,
    descripcion: `Preguntas del tema ${tema.numero} del Auxiliar Administrativo del Estado (bloque ${tema.bloque}), con explicación y artículo.`,
    ley: null,
    tema,
    preguntas,
    totalBanco: filas.length,
    articulos: articulosDe(filas),
    temasRelacionados: [],
    leyesRelacionadas,
    siguiente: sig ? { href: `/test/${sig.slug}`, texto: `Tema ${sig.numero}` } : null,
    enPreparacion: filas.length === 0,
  };
}

function idsDemo(): string[] {
  try {
    const json = JSON.parse(readFileSync(join(process.cwd(), "preguntas/publicas.json"), "utf8")) as Record<string, string[]>;
    return json.demo ?? [];
  } catch {
    return [];
  }
}

export function preguntasPublicasLocales(seleccion: string, fecha = new Date()): PreguntaTest[] {
  return paginaPublica(seleccion, fecha)?.preguntas ?? [];
}
