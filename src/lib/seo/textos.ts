/** Texto indexable de las páginas por ley y por tema. Sale de los datos del banco, sin citas inventadas. */

export function parrafosLey(input: {
  nombre: string;
  nombreCorto: string;
  fecha: string | null;
  total: number;
  enPagina: number;
  articulos: { articulo: string; veces: number }[];
  temas: { numero: number; titulo: string; bloque: string }[];
}): string[] {
  const temas =
    input.temas.length > 0
      ? input.temas.map((t) => `el tema ${t.numero} del bloque ${t.bloque} (${t.titulo})`).join("; ")
      : "el temario del Auxiliar Administrativo del Estado";
  const arts =
    input.articulos.length > 0
      ? input.articulos.map((a) => `el artículo ${a.articulo} (${a.veces} ${a.veces === 1 ? "pregunta" : "preguntas"})`).join(", ")
      : "los artículos que el banco cita en cada explicación";
  const fecha = input.fecha
    ? `Las preguntas contrastadas llevan la fecha de la versión consolidada del BOE (${input.fecha}).`
    : "Cuando el texto consolidado no está fechado en el banco, la explicación remite al artículo y conviene contrastarlo en el BOE.";

  return [
    `Este test reúne preguntas de la ${input.nombre} para preparar el Auxiliar Administrativo del Estado. La ley entra en el temario oficial de la convocatoria publicada en el BOE (BOE-A-2025-26262) y aquí se trabaja con el mismo criterio que en el examen: cuatro opciones, una sola correcta y la penalización de un tercio por cada fallo. No es un texto oficial ni sustituye al BOE. Sirve para comprobar si reconoces el artículo cuando la pregunta cambia el orden de las palabras.`,
    input.total > 0
      ? `En el banco hay ${input.total} preguntas validadas de la ${input.nombreCorto}. Esta página muestra ${input.enPagina}, elegidas de forma estable durante una semana y distintas a la semana siguiente, para que repetir la visita no sea siempre el mismo examen. Al responder ves la opción correcta, la explicación y el artículo exacto. Si fallas, el artículo te dice qué párrafo volver a leer, que es más útil que memorizar la letra.`
      : `Todavía no hay preguntas validadas de la ${input.nombreCorto} en el banco. La página existe para que el temario esté enlazado y para avisar de que este bloque está en preparación. Cuando haya preguntas, el test de esta misma dirección tendrá diez, con su corrección.`,
    `Los artículos que más aparecen en las preguntas de esta ley son ${arts}. No significa que el examen pregunte solo esos preceptos: significa que, con el material que hay hoy, conviene tenerlos localizados antes de pasar a otro tema. ${fecha} Si una reforma cambia el texto, manda el consolidado del BOE y no esta página.`,
    `En el temario de Auxiliar Administrativo, esta norma se estudia sobre todo en ${temas}. Puedes saltar desde aquí al test del tema o a otra ley. El examen real mezcla el bloque I (30 preguntas de materias jurídicas, más una parte psicotécnica que aquí no entra) y el bloque II (50 preguntas, en buena parte de ofimática). Cada error resta un tercio de acierto y las respuestas en blanco no puntúan. Por eso una pregunta dudosa no se contesta igual que una que tienes clara.`,
    `La forma de usar este test es corta: lee el enunciado, contesta, mira el artículo y anota el fallo. Diez preguntas bien corregidas enseñan más que cincuenta sin mirar la ley. Si creas una cuenta gratuita puedes guardar estos fallos y repasarlos al día siguiente, con una sesión de diez preguntas en el camino de temas. El plan de pago quita ese límite, abre los niveles avanzados, los simulacros y la predicción de nota. Cancelas desde tu cuenta, sin permanencia.`,
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

export function palabras(parrafos: string[]): number {
  return parrafos.join(" ").split(/\s+/).filter(Boolean).length;
}
