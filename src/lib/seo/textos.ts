/** Texto indexable de las páginas por ley y por tema. Sale de los datos del banco, sin citas inventadas. */

/** «de la Ley 39/2015», «del TREBEP», «del Real Decreto…». */
export function deNorma(nombre: string): string {
  return /^(Real Decreto|Tratado|TREBEP|TUE|TFUE|RD)\b/.test(nombre) ? `del ${nombre}` : `de la ${nombre}`;
}

export function h1Ley(nombreCorto: string): string {
  return `Test ${nombreCorto} gratis (Auxiliar Administrativo)`;
}

function fechaLarga(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/**
 * Introducción corta de una página por ley. El objetivo es 150–250 palabras:
 * aire, frases breves y datos que salen del banco.
 */
export function introLey(input: {
  nombre: string;
  nombreCorto: string;
  fecha: string | null;
  total: number;
  enPagina: number;
  articulos: { articulo: string }[];
  temas: { numero: number; titulo: string; bloque: string }[];
}): string[] {
  const cuantas = input.enPagina === 10 ? "diez" : String(input.enPagina);
  const temas = input.temas.slice(0, 2);
  const temasTxt =
    temas.length > 0
      ? temas.map((t) => `el tema ${t.numero} del bloque ${t.bloque}`).join(" y ")
      : "el temario de Auxiliar Administrativo";
  const arts = input.articulos.slice(0, 3).map((a) => `el artículo ${a.articulo}`);
  const artsTxt =
    arts.length === 0
      ? "el artículo que cita cada explicación"
      : arts.length === 1
        ? arts[0]
        : `${arts.slice(0, -1).join(", ")} y ${arts.at(-1)}`;
  const fecha = input.fecha
    ? `La versión consolidada del BOE que usamos es la del ${fechaLarga(input.fecha)}.`
    : "Si el banco no fecha el consolidado, contrasta el artículo en el BOE.";

  return [
    `Estas ${cuantas} preguntas son ${deNorma(input.nombre)}. Las haces gratis y sin cuenta, para preparar el Auxiliar Administrativo del Estado. No son el examen: lo pone la Administración. Cada respuesta se apoya en el texto consolidado del BOE, no en un resumen.`,
    `En el banco hay ${input.total} preguntas validadas ${deNorma(input.nombreCorto)}. Aquí ves ${input.enPagina}, las mismas durante una semana. Hay cuatro opciones y una sola correcta. Un fallo resta un tercio, como en la convocatoria del BOE (BOE-A-2025-26262). Si la dejas en blanco, no resta.`,
    `${fecha} Los artículos que más aparecen ahora son ${artsTxt}. No son los únicos que pueden caer. Sirven para abrir la ley por el precepto justo, en vez de releerla entera.`,
    `Esta norma se estudia sobre todo en ${temasTxt}. Si fallas, mira el artículo antes de seguir. Desde aquí saltas a otra norma o al índice de test.`,
    `Si creas una cuenta gratuita, guardamos los fallos y sigues con el resto del banco: diez preguntas al día. El plan de pago quita ese límite y abre los simulacros. Cancelas desde tu cuenta, sin permanencia.`,
  ];
}

export function parrafosTema(input: {
  numero: number;
  titulo: string;
  bloque: string;
  total: number;
  enPagina: number;
  leyes: { nombreCorto: string }[];
  articulos: { articulo: string; veces: number }[];
}): string[] {
  const leyes =
    input.leyes.length > 0
      ? input.leyes.map((l) => l.nombreCorto).join(", ")
      : "la normativa y la documentación que correspondan a este epígrafe";
  const arts =
    input.articulos.length > 0
      ? `En las preguntas actuales se cita sobre todo ${input.articulos.map((a) => `el artículo ${a.articulo}`).join(", ")}.`
      : "Cuando haya preguntas, cada una indicará el artículo o la sección de la documentación oficial.";
  const cuerpo =
    input.total > 0
      ? `Hay ${input.total} preguntas validadas. Aquí ves ${input.enPagina}, que rotan cada semana. La corrección no se queda en «la B»: explica por qué y señala el precepto, para que el repaso vuelva al texto y no a la chuleta.`
      : `Este tema aún no tiene preguntas en el banco. Lo dejamos visible porque forma parte del temario y porque ocultarlo haría parecer que el examen es más corto de lo que es. El bloque II, de atención al público y ofimática, y algunos temas del bloque I siguen en preparación. No vendemos esto como «todo el temario cubierto».`;

  return [
    `Tema ${input.numero} del bloque ${input.bloque} del Auxiliar Administrativo del Estado: ${input.titulo}. El enunciado es el del temario de la convocatoria BOE-A-2025-26262. Esta página es un test de práctica, no un desarrollo doctrinal del tema. La fuente, cuando la pregunta es de una ley, es el texto consolidado del BOE; cuando sea de ofimática, será la documentación del programa que fije la convocatoria.`,
    cuerpo,
    `Las normas que hoy alimentan este tema en el banco son: ${leyes}. ${arts} Si preparas el tema por una academia o por el propio temario, usa el test al final de la lectura, no antes: así el fallo te dice qué párrafo no has fijado.`,
    `En el examen, el bloque ${input.bloque} no se pregunta aislado. La primera parte tiene 30 preguntas del bloque I y la segunda, 50 del bloque II, con un tercio de penalización por error. Un tema flojo pesa, y un tema que todavía no tiene preguntas no se puede dar por estudiado con este banco. Cuando el tema tenga material, el camino de la cuenta gratuita abre el nivel 1 (preguntas más fáciles) y el plan de pago sigue con los niveles siguientes y el examen del tema.`,
    `Si acabas el test, guarda los fallos con una cuenta. Al día siguiente el repaso te los vuelve a poner, que es la parte que de verdad sube la nota. Desde aquí puedes ir al tema siguiente o a la ley concreta si quieres más preguntas del mismo artículo.`,
  ];
}

function unir(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

/** Introducción de las páginas por norma que el Auxiliar no usa (derecho tributario, procesal…). */
export function introLeyOposiciones(input: {
  nombre: string;
  nombreCorto: string;
  fecha: string | null;
  total: number;
  enPagina: number;
  articulos: { articulo: string }[];
  oposiciones: string[];
}): string[] {
  const cuantas = input.enPagina === 10 ? "diez" : String(input.enPagina);
  const arts = input.articulos.slice(0, 3).map((a) => `el artículo ${a.articulo}`);
  const artsTxt = arts.length === 0 ? "el artículo que cita cada explicación" : unir(arts);
  const fecha = input.fecha
    ? `La versión consolidada del BOE que usamos es la del ${fechaLarga(input.fecha)}.`
    : "Contrasta siempre el artículo en el BOE.";
  const opos =
    input.oposiciones.length === 1
      ? `la oposición de ${input.oposiciones[0]}`
      : `las oposiciones de ${unir(input.oposiciones)}`;
  return [
    `Estas ${cuantas} preguntas son ${deNorma(input.nombre)}. Las haces gratis y sin cuenta, para preparar ${opos}. No son el examen: lo pone la Administración. Cada respuesta se apoya en el texto consolidado del BOE, no en un resumen.`,
    `En el banco hay ${input.total} preguntas validadas ${deNorma(input.nombreCorto)}. Aquí ves ${input.enPagina}, las mismas durante una semana. Hay cuatro opciones y una sola correcta. Cada fallo resta una fracción del acierto, según la oposición, y dejar la pregunta en blanco no resta.`,
    `${fecha} Los artículos que más aparecen ahora son ${artsTxt}. No son los únicos que pueden caer. Sirven para abrir la norma por el precepto justo, en vez de releerla entera.`,
    `Si fallas, mira el artículo antes de seguir. Desde aquí saltas a otra norma o a los temas donde entra.`,
    `Si creas una cuenta gratuita, guardamos los fallos y sigues con el resto del banco: diez preguntas al día. El plan de pago quita ese límite y abre los simulacros. Cancelas desde tu cuenta, sin permanencia.`,
  ];
}

/** Texto de la página de un tema de Administrativo, Agente de Hacienda o Tramitación Procesal. */
export function parrafosTemaOposicion(input: {
  oposicion: { nombre: string; penalizacion: string; convocatoria: string | null };
  numero: number;
  titulo: string;
  bloque: string;
  total: number;
  enPagina: number;
  leyes: { nombreCorto: string }[];
  articulos: { articulo: string; veces: number }[];
}): string[] {
  const leyes = input.leyes.length > 0 ? input.leyes.map((l) => l.nombreCorto).join(", ") : "la normativa que corresponde a este epígrafe";
  const arts =
    input.articulos.length > 0
      ? `En las preguntas actuales se cita sobre todo ${unir(input.articulos.map((a) => `el artículo ${a.articulo}`))}.`
      : "Cada pregunta indica el artículo o la sección de la documentación oficial.";
  const conv = input.oposicion.convocatoria ? ` (${input.oposicion.convocatoria})` : "";
  return [
    `Tema ${input.numero} del bloque ${input.bloque} de ${input.oposicion.nombre}: ${input.titulo}. El enunciado es el del temario de la última convocatoria${conv}. Esta página es un test de práctica, no un desarrollo del tema. Cada pregunta se apoya en el texto consolidado del BOE.`,
    `Hay ${input.total} preguntas validadas. Aquí ves ${input.enPagina}, que rotan cada semana. La corrección no se queda en «la B»: explica por qué y señala el precepto, para que el repaso vuelva al texto y no a la chuleta.`,
    `Las normas que hoy alimentan este tema en el banco son: ${leyes}. ${arts} Usa el test al final de la lectura, no antes: así el fallo te dice qué párrafo no has fijado.`,
    `En el examen, cada error resta ${input.oposicion.penalizacion} del acierto y la pregunta en blanco no resta. Un tema flojo pesa, así que conviene repasar todos. Con una cuenta gratuita guardamos tus fallos y los repasas al día siguiente.`,
  ];
}

export function palabras(parrafos: string[]): number {
  return parrafos.join(" ").split(/\s+/).filter(Boolean).length;
}
