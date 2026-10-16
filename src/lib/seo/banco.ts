import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { esquemaArchivo, esquemaLey, esquemaOposicion, type Pregunta } from "@/lib/preguntas/esquema";
import type { PreguntaTest } from "@/lib/test/tipos";
import { elegirSemana, slugTema, type RutaPublica } from "./seleccion";
import { deNorma, h1Ley } from "./textos";

export type PreguntaPublica = PreguntaTest & { dificultad: 1 | 2 | 3 };

type LeyInfo = { slug: string; nombre: string; nombreCorto: string; fecha: string | null };
type TemaInfo = { numero: number; bloque: string; titulo: string; slug: string; oposicion?: string };

/** Oposiciones con páginas públicas propias, además del Auxiliar (que conserva sus páginas de siempre). */
const PREFIJO_OPOSICION: Record<string, string> = {
  "admin-age": "administrativo",
  "agente-aeat": "agente-hacienda",
  "tramitacion-procesal": "tramitacion-procesal",
};

export type OposicionPublica = {
  slug: string;
  nombre: string;
  corto: string;
  penalizacion: string;
  convocatoria: string | null;
};

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
  /** Página de un tema de una oposición distinta del Auxiliar. */
  oposicion: OposicionPublica | null;
  /** Páginas de una norma que no es del Auxiliar: oposiciones donde se pregunta. */
  oposiciones: string[];
};

type Fila = Pregunta & { leyInfo: LeyInfo | null; temaInfo: TemaInfo | null };

const CORTO: Record<string, string> = {
  "admin-age": "Administrativo",
  "agente-aeat": "Agente de Hacienda",
  "tramitacion-procesal": "Tramitación Procesal",
};

type Datos = {
  leyes: LeyInfo[];
  temas: TemaInfo[];
  filas: Fila[];
  porLey: Map<string, Fila[]>;
  porTema: Map<number, Fila[]>;
  /** Normas que solo se preguntan fuera del Auxiliar. */
  leyesOtras: LeyInfo[];
  porLeyOtras: Map<string, Fila[]>;
  oposicionesOtras: OposicionPublica[];
  temasOtras: Map<string, TemaInfo[]>;
  porTemaOtras: Map<string, Fila[]>;
};

let cache: Datos | null = null;

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
  // Las páginas públicas son las del Auxiliar y solo de sus materias con texto legal: los psicotécnicos
  // (bloque III) no tienen ley ni BOE, y las normas del Administrativo no son del temario del Auxiliar.
  const temas: TemaInfo[] = opo.temas.filter((t) => t.bloque !== "III").map((t) => ({
    numero: t.numero,
    bloque: t.bloque,
    titulo: t.titulo,
    slug: slugTema(t.numero, t.titulo),
  }));
  const leyPorSlug = new Map(leyes.map((l) => [l.slug, l]));
  const temaPorNumero = new Map(temas.map((t) => [t.numero, t]));
  const filas: Fila[] = [];
  const todas: Pregunta[] = [];
  for (const archivo of readdirSync(join(raiz, "preguntas")).filter((f) => f.endsWith(".json") && f !== "publicas.json")) {
    const parsed = esquemaArchivo.safeParse(JSON.parse(readFileSync(join(raiz, "preguntas", archivo), "utf8")));
    if (!parsed.success) continue;
    for (const p of parsed.data.preguntas) {
      if (p.estado !== "validada" || p.ley === "psicotecnico") continue;
      todas.push(p);
      const numero = p.temas["aux-age"] ?? null;
      if (numero === null) continue;
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
  const leyesConBanco = leyes.filter((l) => porLey.has(l.slug));

  // Resto de oposiciones: una página por tema con preguntas y una por cada norma que el Auxiliar no usa.
  const oposicionesOtras: OposicionPublica[] = [];
  const temasOtras = new Map<string, TemaInfo[]>();
  const porTemaOtras = new Map<string, Fila[]>();
  for (const o of opos) {
    const prefijo = PREFIJO_OPOSICION[o.slug];
    if (!prefijo) continue;
    const lista: TemaInfo[] = [];
    for (const t of o.temas) {
      const info: TemaInfo = {
        numero: t.numero,
        bloque: t.bloque,
        titulo: t.titulo,
        slug: `${prefijo}-${slugTema(t.numero, t.titulo)}`,
        oposicion: CORTO[o.slug] ?? o.nombre,
      };
      const delTema = todas
        .filter((p) => p.temas[o.slug] === t.numero)
        .map((p) => ({ ...p, leyInfo: p.ley ? (leyPorSlug.get(p.ley) ?? null) : null, temaInfo: info }));
      if (delTema.length === 0) continue;
      lista.push(info);
      porTemaOtras.set(info.slug, delTema);
    }
    if (lista.length === 0) continue;
    temasOtras.set(o.slug, lista);
    oposicionesOtras.push({
      slug: o.slug,
      nombre: o.nombre,
      corto: CORTO[o.slug] ?? o.nombre,
      penalizacion: o.formato_simulacro.penalizacion === 0.25 ? "un cuarto" : "un tercio",
      convocatoria: o.examen_estimado?.convocatoria ?? null,
    });
  }
  const slugsAux = new Set(leyesConBanco.map((l) => l.slug));
  const porLeyOtras = new Map<string, Fila[]>();
  for (const p of todas) {
    if (!p.ley || slugsAux.has(p.ley)) continue;
    if (!Object.keys(p.temas).some((k) => PREFIJO_OPOSICION[k])) continue;
    const lista = porLeyOtras.get(p.ley) ?? [];
    lista.push({ ...p, leyInfo: leyPorSlug.get(p.ley) ?? null, temaInfo: null });
    porLeyOtras.set(p.ley, lista);
  }
  const leyesOtras = leyes.filter((l) => porLeyOtras.has(l.slug));
  cache = { leyes: leyesConBanco, temas, filas, porLey, porTema, leyesOtras, porLeyOtras, oposicionesOtras, temasOtras, porTemaOtras };
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
  const { leyes, temas, leyesOtras, temasOtras } = cargar();
  return [
    ...leyes.map((l) => ({ slug: l.slug, tipo: "ley" as const, ambito: "aux" as const })),
    ...temas.map((t) => ({ slug: t.slug, tipo: "tema" as const, numero: t.numero, ambito: "aux" as const })),
    ...leyesOtras.map((l) => ({ slug: l.slug, tipo: "ley" as const, ambito: "otra" as const })),
    ...[...temasOtras.values()].flat().map((t) => ({ slug: t.slug, tipo: "tema" as const, numero: t.numero, ambito: "otra" as const })),
  ];
}

/** Para el índice: oposiciones distintas del Auxiliar con sus temas y las normas que solo ellas usan. */
export function indiceOtrasOposiciones() {
  const { oposicionesOtras, temasOtras, leyesOtras, porLeyOtras } = cargar();
  return {
    oposiciones: oposicionesOtras.map((o) => ({ ...o, temas: temasOtras.get(o.slug) ?? [] })),
    leyes: leyesOtras.map((l) => ({ ...l, total: porLeyOtras.get(l.slug)?.length ?? 0 })),
  };
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
      oposicion: null,
      oposiciones: [],
    };
  }

  const ley = datos.leyes.find((l) => l.slug === slug);
  const tema = datos.temas.find((t) => t.slug === slug);
  if (!ley && !tema) return paginaOtra(datos, slug, fecha);

  if (ley) {
    const filas = datos.porLey.get(ley.slug) ?? [];
    const preguntas = elegirSemana(filas, ley.slug, fecha).map(aPregunta);
    const temasRelacionados = datos.temas.filter((t) => filas.some((f) => f.temaInfo?.numero === t.numero));
    const indice = datos.leyes.findIndex((l) => l.slug === ley.slug);
    const sig = datos.leyes[(indice + 1) % datos.leyes.length];
    return {
      slug,
      tipo: "ley",
      titulo: `Test ${ley.nombreCorto} gratis`,
      h1: h1Ley(ley.nombreCorto),
      descripcion: `${preguntas.length} preguntas gratis ${deNorma(ley.nombreCorto)} para el Auxiliar Administrativo del Estado, con explicación y artículo del BOE.`,
      ley,
      tema: null,
      preguntas,
      totalBanco: filas.length,
      articulos: articulosDe(filas),
      temasRelacionados,
      leyesRelacionadas: [],
      siguiente: sig && sig.slug !== ley.slug ? { href: `/test/${sig.slug}`, texto: `Test ${sig.nombreCorto} gratis` } : null,
      enPreparacion: filas.length === 0,
      oposicion: null,
      oposiciones: [],
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
    oposicion: null,
    oposiciones: [],
  };
}

/** Páginas de las oposiciones distintas del Auxiliar: temas propios y normas que el Auxiliar no usa. */
function paginaOtra(datos: Datos, slug: string, fecha: Date): PaginaPublica | null {
  const leyOtra = datos.leyesOtras.find((l) => l.slug === slug);
  if (leyOtra) {
    const filas = datos.porLeyOtras.get(leyOtra.slug) ?? [];
    const preguntas = elegirSemana(filas, leyOtra.slug, fecha).map((f) => aPregunta(f));
    const nombres = datos.oposicionesOtras
      .filter((o) => filas.some((f) => f.temas[o.slug] !== undefined))
      .map((o) => o.corto);
    const temasRelacionados = [...datos.temasOtras.values()]
      .flat()
      .filter((t) => (datos.porTemaOtras.get(t.slug) ?? []).some((f) => f.ley === leyOtra.slug))
      .slice(0, 8);
    const indice = datos.leyesOtras.findIndex((l) => l.slug === leyOtra.slug);
    const sig = datos.leyesOtras[(indice + 1) % datos.leyesOtras.length];
    return {
      slug,
      tipo: "ley",
      titulo: `Test ${leyOtra.nombreCorto} gratis`,
      h1: `Test ${leyOtra.nombreCorto} gratis (oposiciones)`,
      descripcion: `${preguntas.length} preguntas gratis ${deNorma(leyOtra.nombreCorto)} para oposiciones (${nombres.join(", ")}), con explicación y artículo del BOE.`,
      ley: leyOtra,
      tema: null,
      preguntas,
      totalBanco: filas.length,
      articulos: articulosDe(filas),
      temasRelacionados,
      leyesRelacionadas: [],
      siguiente: sig && sig.slug !== leyOtra.slug ? { href: `/test/${sig.slug}`, texto: `Test ${sig.nombreCorto} gratis` } : null,
      enPreparacion: filas.length === 0,
      oposicion: null,
      oposiciones: nombres,
    };
  }

  for (const o of datos.oposicionesOtras) {
    const temas = datos.temasOtras.get(o.slug) ?? [];
    const tema = temas.find((t) => t.slug === slug);
    if (!tema) continue;
    const filas = datos.porTemaOtras.get(tema.slug) ?? [];
    const preguntas = elegirSemana(filas, tema.slug, fecha).map((f) => aPregunta(f));
    const indice = temas.findIndex((t) => t.numero === tema.numero);
    const sig = temas[(indice + 1) % temas.length];
    return {
      slug,
      tipo: "tema",
      titulo: `${o.corto}, tema ${tema.numero}. ${tema.titulo}`,
      h1: `Test del tema ${tema.numero} de ${o.nombre}: ${tema.titulo}`,
      descripcion: `Preguntas del tema ${tema.numero} de ${o.nombre} (bloque ${tema.bloque}), con explicación y artículo del BOE.`,
      ley: null,
      tema,
      preguntas,
      totalBanco: filas.length,
      articulos: articulosDe(filas),
      temasRelacionados: [],
      leyesRelacionadas: datos.leyesOtras.filter((l) => filas.some((f) => f.ley === l.slug)),
      siguiente: sig && sig.slug !== tema.slug ? { href: `/test/${sig.slug}`, texto: `Tema ${sig.numero}` } : null,
      enPreparacion: false,
      oposicion: o,
      oposiciones: [],
    };
  }
  return null;
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

/** Barajado estable: la misma semilla da siempre el mismo orden. */
function barajar<T>(lista: T[], semilla: string): T[] {
  let h = 2166136261;
  for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const azar = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/**
 * Preguntas del reto relámpago del día: las mismas para todo el mundo, sacadas solo de las
 * que ya son públicas esa semana (demo, leyes y temas), para no regalar el banco completo.
 */
export function preguntasReto(dia: string, cuantas = 60): PreguntaTest[] {
  const vistas = new Map<string, PreguntaTest>();
  for (const slug of ["demo", ...rutasPublicas().filter((r) => r.ambito !== "otra").map((r) => r.slug)]) {
    for (const p of paginaPublica(slug, new Date(`${dia}T12:00:00Z`))?.preguntas ?? []) vistas.set(p.id, p);
  }
  // Las de enunciado largo no caben en un reto de 60 segundos.
  const cortas = [...vistas.values()].filter((p) => p.enunciado.length <= 160);
  return barajar(cortas, `reto-${dia}`).slice(0, cuantas);
}
