/**
 * Aptitud verbal (tema 30): ortografía, usos de palabras, gramática, sinónimos, antónimos, analogías
 * y términos excluidos. Escritas a mano y revisadas; solo van palabras con una respuesta clara.
 */
import type { Borrador, Dificultad } from "./psicotecnicos-base";

const TEMA = 30;

type Item = { e: string; ok: string; no: [string, string, string]; x: string; d: Dificultad };

function lote(tipo: string, articulo: string, items: Item[]): Borrador[] {
  return items.map((i) => ({
    tipo,
    tema: TEMA,
    articulo,
    enunciado: i.e,
    correcta: i.ok,
    otras: [...i.no],
    explicacion: i.x,
    dificultad: i.d,
  }));
}

const ORTO = "¿Qué palabra está escrita correctamente?";

const ortografia: Item[] = [
  { e: ORTO, ok: "exhausto", no: ["exausto", "exháusto", "hexausto"], x: "Se escribe «exhausto», con x y con h, como «exhaustivo».", d: 1 },
  { e: ORTO, ok: "desahucio", no: ["desaucio", "deshaucio", "desahusio"], x: "«Desahucio» lleva una h intercalada: des-ahu-cio.", d: 2 },
  { e: ORTO, ok: "excepción", no: ["exepción", "execpción", "excepsión"], x: "Se escribe «excepción», con xc, como «excepto», y termina en -ción.", d: 1 },
  { e: ORTO, ok: "reivindicar", no: ["reinvindicar", "reibindicar", "reyvindicar"], x: "«Reivindicar» se escribe con v y sin n intermedia: viene de «re-» y «vindicar».", d: 2 },
  { e: ORTO, ok: "subrayar", no: ["subrallar", "subraiar", "sobrayar"], x: "«Subrayar» se escribe con y, porque deriva de «raya» y del prefijo «sub-».", d: 1 },
  { e: ORTO, ok: "adolescente", no: ["adolecente", "adolesente", "adoleszente"], x: "Se escribe «adolescente», con sc, como «adolescencia».", d: 1 },
  { e: ORTO, ok: "vehículo", no: ["vehiculo", "bejículo", "vehícolo"], x: "«Vehículo» es esdrújula y lleva tilde: ve-hí-cu-lo.", d: 1 },
  { e: ORTO, ok: "rehén", no: ["rehen", "reén", "rején"], x: "«Rehén» es una palabra aguda acabada en -n: lleva tilde en la última sílaba.", d: 2 },
  { e: ORTO, ok: "ahínco", no: ["ahinco", "aínco", "ainco"], x: "«Ahínco» lleva tilde en la í, porque forma hiato con la a que la precede.", d: 3 },
  { e: ORTO, ok: "prohibir", no: ["proibir", "prohivir", "prójibir"], x: "«Prohibir» se escribe con h intercalada y con b.", d: 1 },
  { e: ORTO, ok: "obstáculo", no: ["obstaculo", "ostáculo", "obtáculo"], x: "«Obstáculo» es esdrújula: lleva tilde y conserva la s de «obstar».", d: 1 },
  { e: ORTO, ok: "exuberante", no: ["exhuberante", "exuverante", "exhuverante"], x: "«Exuberante» se escribe sin h y con b.", d: 3 },
  { e: ORTO, ok: "envergadura", no: ["embergadura", "enverjadura", "enbergadura"], x: "«Envergadura» se escribe con nv (antes de v va n) y con g.", d: 2 },
  { e: ORTO, ok: "bienvenido", no: ["bienbenido", "vienvenido", "bien venido"], x: "«Bienvenido» es una sola palabra y se escribe con v.", d: 1 },
  { e: ORTO, ok: "imprescindible", no: ["imprecindible", "inprescindible", "imprescidible"], x: "«Imprescindible» lleva im- delante de p y -sc- en el centro, como «prescindir».", d: 2 },
];

const usos: Item[] = [
  { e: "Elige la forma correcta: «___ si llega el informe a tiempo.»", ok: "A ver", no: ["Haber", "A haber", "Ha ver"], x: "«A ver» (preposición + verbo ver) sirve para comprobar algo: «A ver si llega». «Haber» es el verbo auxiliar.", d: 1 },
  { e: "Elige la forma correcta: «No quiero café, ___ té.»", ok: "sino", no: ["si no", "sinó", "si nó"], x: "«Sino» es la conjunción que contrapone: «no café, sino té».", d: 1 },
  { e: "Elige la forma correcta: «___ llegas antes de las nueve, perderás el turno.»", ok: "Si no", no: ["Sino", "Sinó", "Si nó"], x: "Aquí es la condición «si» seguida del adverbio «no»: «Si no llegas…». Se escribe separado.", d: 1 },
  { e: "Elige la forma correcta: «¿___ no has presentado la solicitud?»", ok: "Por qué", no: ["Porque", "Porqué", "Por que"], x: "En las preguntas directas se escribe «por qué», en dos palabras y con tilde en «qué».", d: 1 },
  { e: "Elige la forma correcta: «Ha cancelado la cita ___ está enfermo.»", ok: "porque", no: ["por qué", "porqué", "por que"], x: "Para dar la causa se usa la conjunción «porque», en una palabra y sin tilde.", d: 1 },
  { e: "Elige la forma correcta: «Desconozco el ___ de su decisión.»", ok: "porqué", no: ["porque", "por qué", "por que"], x: "«Porqué» es un sustantivo que significa «motivo»: va tras un artículo y lleva tilde.", d: 2 },
  { e: "Elige la forma correcta: «¿___ bolígrafo has firmado?»", ok: "Con qué", no: ["Conque", "Con que", "Comque"], x: "En una pregunta, «qué» es interrogativo: se escribe «con qué», en dos palabras y con tilde.", d: 2 },
  { e: "Elige la forma correcta: «Hay una ___ alrededor del edificio.»", ok: "valla", no: ["vaya", "baya", "balla"], x: "«Valla» es una cerca. «Vaya» es del verbo ir y «baya» es un tipo de fruto.", d: 1 },
  { e: "Elige la forma correcta: «Deje los documentos ___, sobre la mesa.»", ok: "ahí", no: ["hay", "ay", "ahi"], x: "«Ahí» es un adverbio de lugar y lleva tilde. «Hay» es del verbo haber.", d: 1 },
  { e: "Elige la forma correcta: «Espero que ___ llegado a tiempo.»", ok: "haya", no: ["halla", "aya", "allá"], x: "Aquí se necesita el verbo auxiliar «haber» en subjuntivo: «haya llegado».", d: 2 },
  { e: "Elige la forma correcta: «El expediente se ___ en el archivo central.»", ok: "halla", no: ["haya", "aya", "allá"], x: "«Hallarse» significa «encontrarse»: «el expediente se halla en el archivo».", d: 2 },
  { e: "Elige la forma correcta: «El informe ___ datos muy importantes.»", ok: "revela", no: ["rebela", "revéla", "rebéla"], x: "«Revelar» es descubrir o dar a conocer. «Rebelarse» es sublevarse.", d: 2 },
];

const gramatica: Item[] = [
  { e: "¿Cuál de las siguientes oraciones es correcta?", ok: "Hubo muchas solicitudes este año.", no: ["Hubieron muchas solicitudes este año.", "Habían muchas solicitudes este año.", "Han habido muchas solicitudes este año."], x: "Cuando «haber» significa «existir» es impersonal y va siempre en singular: «hubo», «había», «ha habido».", d: 2 },
  { e: "¿Cuál de las siguientes oraciones es correcta?", ok: "Me alegro de que hayas aprobado.", no: ["Me alegro que hayas aprobado.", "Pienso de que has aprobado.", "Me alegro de qué hayas aprobado."], x: "El verbo «alegrarse» lleva la preposición «de»: «me alegro de que». Omitirla es queísmo.", d: 2 },
  { e: "¿Cuál de las siguientes oraciones es correcta?", ok: "Me dijo que vendría mañana.", no: ["Me dijo de que vendría mañana.", "Me comentó de que vendría mañana.", "Me aseguró de que vendría mañana."], x: "Los verbos «decir», «comentar» y «asegurar» no llevan la preposición «de»: añadirla es dequeísmo.", d: 2 },
  { e: "¿Cuál de las siguientes oraciones es correcta?", ok: "Entre tú y yo no hay secretos.", no: ["Entre ti y yo no hay secretos.", "Entre tú y mí no hay secretos.", "Entre ti y mí no hay secretos."], x: "Tras «entre» se usan los pronombres «tú» y «yo», no «ti» ni «mí».", d: 3 },
];

const sinonimos: Item[] = [
  { e: "Elige el sinónimo de «efímero».", ok: "pasajero", no: ["duradero", "antiguo", "resistente"], x: "«Efímero» es lo que dura poco tiempo, como «pasajero».", d: 1 },
  { e: "Elige el sinónimo de «inicuo».", ok: "injusto", no: ["piadoso", "tranquilo", "secreto"], x: "«Inicuo» significa «injusto» o contrario a la equidad.", d: 3 },
  { e: "Elige el sinónimo de «perspicaz».", ok: "agudo", no: ["torpe", "tardío", "silencioso"], x: "«Perspicaz» es quien percibe con agudeza, es decir, «agudo».", d: 2 },
  { e: "Elige el sinónimo de «locuaz».", ok: "hablador", no: ["callado", "tímido", "prudente"], x: "«Locuaz» es quien habla mucho: «hablador».", d: 1 },
  { e: "Elige el sinónimo de «austero».", ok: "sobrio", no: ["lujoso", "alegre", "generoso"], x: "«Austero» es lo que no tiene lujos ni adornos: «sobrio».", d: 2 },
  { e: "Elige el sinónimo de «escueto».", ok: "breve", no: ["extenso", "confuso", "cortés"], x: "«Escueto» es lo que se dice con pocas palabras, sin adornos: «breve».", d: 2 },
  { e: "Elige el sinónimo de «subsanar».", ok: "corregir", no: ["ignorar", "aplazar", "firmar"], x: "«Subsanar» es reparar o remediar un defecto: «corregir».", d: 2 },
  { e: "Elige el sinónimo de «perentorio».", ok: "urgente", no: ["opcional", "lento", "injusto"], x: "«Perentorio» se dice de un plazo o de un asunto que apremia: «urgente».", d: 2 },
  { e: "Elige el sinónimo de «preceptivo».", ok: "obligatorio", no: ["voluntario", "posible", "inútil"], x: "«Preceptivo» es lo que está ordenado por un precepto: «obligatorio».", d: 2 },
  { e: "Elige el sinónimo de «acatar».", ok: "obedecer", no: ["discutir", "ignorar", "proponer"], x: "«Acatar» es aceptar y cumplir una orden o una norma: «obedecer».", d: 2 },
  { e: "Elige el sinónimo de «sufragar».", ok: "costear", no: ["cobrar", "ahorrar", "prestar"], x: "«Sufragar» significa pagar un gasto: «costear».", d: 3 },
];

const antonimos: Item[] = [
  { e: "Elige el antónimo de «prolijo».", ok: "conciso", no: ["extenso", "detallado", "minucioso"], x: "«Prolijo» es lo largo y con exceso de detalles; su contrario es «conciso».", d: 3 },
  { e: "Elige el antónimo de «veraz».", ok: "mentiroso", no: ["sincero", "honrado", "fiel"], x: "«Veraz» es quien dice la verdad; su contrario es «mentiroso».", d: 1 },
  { e: "Elige el antónimo de «diligente».", ok: "negligente", no: ["cuidadoso", "esforzado", "eficiente"], x: "«Diligente» es quien cumple con cuidado y rapidez; su contrario es «negligente».", d: 2 },
  { e: "Elige el antónimo de «lícito».", ok: "ilícito", no: ["legal", "permitido", "justo"], x: "«Lícito» es lo permitido por la ley; su contrario es «ilícito».", d: 1 },
  { e: "Elige el antónimo de «anverso».", ok: "reverso", no: ["cara", "frente", "portada"], x: "El «anverso» es la cara principal de una moneda o una hoja; la contraria es el «reverso».", d: 2 },
  { e: "Elige el antónimo de «absolver».", ok: "condenar", no: ["perdonar", "liberar", "indultar"], x: "«Absolver» es declarar libre de culpa; su contrario es «condenar».", d: 2 },
  { e: "Elige el antónimo de «cóncavo».", ok: "convexo", no: ["hueco", "curvo", "profundo"], x: "Una superficie «cóncava» se hunde hacia dentro; la «convexa» sobresale.", d: 2 },
  { e: "Elige el antónimo de «pródigo».", ok: "tacaño", no: ["generoso", "rico", "espléndido"], x: "«Pródigo» es quien gasta o da en abundancia; su contrario es «tacaño».", d: 3 },
];

const analogias: Item[] = [
  { e: "Pluma es a escribir como tijera es a…", ok: "cortar", no: ["coser", "pegar", "dibujar"], x: "La pluma sirve para escribir y la tijera, para cortar: se relaciona un objeto con su función.", d: 1 },
  { e: "Frío es a calor como alto es a…", ok: "bajo", no: ["grande", "ancho", "caliente"], x: "Frío y calor son opuestos, igual que alto y bajo.", d: 1 },
  { e: "Libro es a capítulo como ley es a…", ok: "artículo", no: ["sentencia", "reglamento", "tribunal"], x: "Un libro se divide en capítulos y una ley, en artículos: se relaciona el todo con su parte.", d: 2 },
  { e: "Juez es a sentencia como legislador es a…", ok: "ley", no: ["multa", "recurso", "tribunal"], x: "El juez dicta sentencias y el legislador hace leyes: se relaciona quien actúa con lo que produce.", d: 2 },
  { e: "Pie es a pierna como mano es a…", ok: "brazo", no: ["dedo", "guante", "uña"], x: "El pie está en el extremo de la pierna y la mano, en el del brazo.", d: 1 },
  { e: "Semana es a día como año es a…", ok: "mes", no: ["siglo", "década", "minuto"], x: "Una semana se compone de días y un año, de meses: se relaciona una unidad con las que la forman.", d: 2 },
];

const excluidos: Item[] = [
  { e: "¿Qué palabra no pertenece al grupo? Madrid, Sevilla, Lisboa, Valencia.", ok: "Lisboa", no: ["Madrid", "Sevilla", "Valencia"], x: "Madrid, Sevilla y Valencia son ciudades españolas; Lisboa es la capital de Portugal.", d: 1 },
  { e: "¿Qué palabra no pertenece al grupo? Martillo, destornillador, alicates, folio.", ok: "folio", no: ["martillo", "destornillador", "alicates"], x: "Martillo, destornillador y alicates son herramientas; el folio es papel.", d: 1 },
  { e: "¿Qué palabra no pertenece al grupo? Ley, decreto, reglamento, expediente.", ok: "expediente", no: ["ley", "decreto", "reglamento"], x: "Ley, decreto y reglamento son normas; el expediente es el conjunto de documentos de un asunto.", d: 2 },
  { e: "¿Qué palabra no pertenece al grupo? Lunes, jueves, enero, sábado.", ok: "enero", no: ["lunes", "jueves", "sábado"], x: "Lunes, jueves y sábado son días de la semana; enero es un mes.", d: 1 },
];

export function verbales(): Borrador[] {
  return [
    ...lote("ortografia", "Ortografía", ortografia),
    ...lote("usos", "Uso de palabras", usos),
    ...lote("gramatica", "Gramática", gramatica),
    ...lote("sinonimo", "Sinónimos", sinonimos),
    ...lote("antonimo", "Antónimos", antonimos),
    ...lote("analogia", "Analogías", analogias),
    ...lote("excluido", "Término excluido", excluidos),
  ];
}
