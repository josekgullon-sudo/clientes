/**
 * «¿Sabías que…?» de Clara: datos del temario, uno al día.
 * Cada dato está comprobado contra el texto consolidado del BOE en /fuentes.
 */
export type Curiosidad = { texto: string; fuente: string };

export const CURIOSIDADES: Curiosidad[] = [
  { texto: "La bandera de España tiene la franja amarilla de doble anchura que cada una de las rojas.", fuente: "Constitución, art. 4.1" },
  { texto: "La Constitución dice que la capital del Estado es «la villa de Madrid».", fuente: "Constitución, art. 5" },
  { texto: "Los españoles son mayores de edad a los dieciocho años, y lo dice la propia Constitución.", fuente: "Constitución, art. 12" },
  { texto: "El Congreso tiene un mínimo de 300 y un máximo de 400 Diputados.", fuente: "Constitución, art. 68.1" },
  { texto: "Ceuta y Melilla eligen un Diputado cada una.", fuente: "Constitución, art. 68.2" },
  { texto: "Cada provincia elige cuatro Senadores, pero Gran Canaria, Mallorca y Tenerife eligen tres cada una.", fuente: "Constitución, art. 69.2 y 69.3" },
  { texto: "El Tribunal Constitucional tiene 12 miembros, nombrados para nueve años y renovados por terceras partes cada tres.", fuente: "Constitución, art. 159" },
  { texto: "El Consejo de Estado es el supremo órgano consultivo del Gobierno.", fuente: "Constitución, art. 107" },
  { texto: "El Consejo General del Poder Judicial lo forman su Presidente y veinte miembros nombrados por cinco años.", fuente: "Constitución, art. 122.3" },
  { texto: "El Defensor del Pueblo es el alto comisionado de las Cortes Generales.", fuente: "Constitución, art. 54" },
  { texto: "Los valores superiores del ordenamiento son cuatro: libertad, justicia, igualdad y pluralismo político.", fuente: "Constitución, art. 1.1" },
  { texto: "Ningún español de origen puede ser privado de su nacionalidad.", fuente: "Constitución, art. 11.2" },
  { texto: "Si la norma no fija plazo para resolver un procedimiento, el plazo máximo es de tres meses.", fuente: "Ley 39/2015, art. 21.3" },
  { texto: "El plazo máximo para resolver no puede pasar de seis meses, salvo que una ley o el Derecho de la UE digan otra cosa.", fuente: "Ley 39/2015, art. 21.2" },
  { texto: "Cuando un plazo va por días, son hábiles: no cuentan sábados, domingos ni festivos.", fuente: "Ley 39/2015, art. 30.2" },
  { texto: "Un plazo por horas nunca puede pasar de veinticuatro horas; si no, se expresa en días.", fuente: "Ley 39/2015, art. 30.1" },
  { texto: "El recurso de alzada contra un acto expreso se interpone en un mes, y se resuelve en tres meses como máximo.", fuente: "Ley 39/2015, art. 122" },
  { texto: "El recurso de reposición se interpone en un mes y se resuelve también en un mes como máximo.", fuente: "Ley 39/2015, art. 124" },
  { texto: "Un menor puede consentir el tratamiento de sus datos personales a partir de los catorce años.", fuente: "LO 3/2018, art. 7.1" },
  { texto: "Los funcionarios tienen veintidós días hábiles de vacaciones al año, y los sábados no cuentan como hábiles.", fuente: "TREBEP, art. 50.1" },
  { texto: "El castellano es la lengua oficial del Estado: todos los españoles tienen el deber de conocerla y el derecho a usarla.", fuente: "Constitución, art. 3.1" },
  { texto: "El Congreso se elige por cuatro años.", fuente: "Constitución, art. 68.4" },
];

/** La curiosidad del día: la misma para todo el mundo y cambia cada día. */
export function curiosidadDelDia(dia: string): Curiosidad {
  const n = Math.floor(Date.parse(`${dia}T00:00:00Z`) / 86_400_000);
  return CURIOSIDADES[((n % CURIOSIDADES.length) + CURIOSIDADES.length) % CURIOSIDADES.length];
}
