import type { NodoCamino } from "@/lib/estudio/camino";
import type { PreguntaTest } from "@/lib/test/tipos";

export const temasVista: NodoCamino[] = [
  { tema_id: "11111111-1111-4111-8111-111111111111", numero: 1, titulo: "La Constitución Española de 1978", bloque: "I", total: 40, nivel: 2, lecciones: 1, corona: null },
  { tema_id: "22222222-2222-4222-8222-222222222222", numero: 2, titulo: "La Corona y las Cortes Generales", bloque: "I", total: 18, nivel: 1, lecciones: 0, corona: null },
  { tema_id: "33333333-3333-4333-8333-333333333333", numero: 3, titulo: "El Gobierno y la Administración", bloque: "I", total: 22, nivel: 5, lecciones: 3, corona: "plata" },
  { tema_id: "66666666-6666-4666-8666-666666666666", numero: 6, titulo: "Organización territorial", bloque: "I", total: 0, nivel: 0, lecciones: 0, corona: null },
];

export const preguntasVista: PreguntaTest[] = [
  {
    id: "vista-1",
    enunciado: "Cuando la norma reguladora de un procedimiento no fija el plazo máximo para resolver, ¿cuál es ese plazo?",
    opciones: ["Un mes", "Tres meses", "Seis meses", "Dos meses"],
    correcta: 1,
    explicacion: "El artículo 21.3 de la Ley 39/2015 fija tres meses si la norma no dice otra cosa.",
    articulo: "21.3",
    ley: "Ley 39/2015",
    tema: { numero: 8, titulo: "El procedimiento administrativo" },
  },
  {
    id: "vista-2",
    enunciado: "¿Quién sanciona las leyes?",
    opciones: ["El Gobierno", "El Rey", "El Congreso", "El Tribunal Constitucional"],
    correcta: 1,
    explicacion: "El artículo 91 de la Constitución atribuye al Rey la sanción de las leyes.",
    articulo: "91",
    ley: "Constitución Española",
    tema: { numero: 1, titulo: "La Constitución Española de 1978" },
  },
  {
    id: "vista-3",
    enunciado: "El derecho de petición está reconocido en la Constitución en el artículo…",
    opciones: ["14", "23", "29", "53"],
    correcta: 2,
    explicacion: "El artículo 29 reconoce el derecho de petición individual y colectiva.",
    articulo: "29",
    ley: "Constitución Española",
    tema: { numero: 1, titulo: "La Constitución Española de 1978" },
  },
];
