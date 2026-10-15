/** Razonamiento lógico (tema 32): series de letras, orden, calendario, reloj, silogismos y problemas. */
import { DIAS, LETRAS, MESES, cifra, distractoresNumericos, euros, type Borrador, type crearAzar } from "./psicotecnicos-base";

type Azar = ReturnType<typeof crearAzar>;
const TEMA = 32;
const ENYE = 14;
const ALFABETO = "Alfabeto español de 27 letras (de la A a la Z, con la Ñ)";

/** Una serie «salta» la Ñ si pasa de una letra anterior a una posterior sin pararse en ella: se evita para no dar pie a dudas. */
const saltaEnye = (idx: number[]) => idx.some((v, i) => i > 0 && Math.min(idx[i - 1], v) < ENYE && Math.max(idx[i - 1], v) > ENYE);

function letrasVecinas(a: Azar, correcta: number, extra: number[]) {
  const vistos = new Set<number>([correcta]);
  const salida: number[] = [];
  for (const c of [...extra, correcta + 1, correcta - 1, correcta + 2, correcta - 2, correcta + 3]) {
    if (c < 0 || c > 26 || vistos.has(c)) continue;
    vistos.add(c);
    salida.push(c);
  }
  return salida.slice(0, 3).map((i) => LETRAS[i]);
}

export function serieDeLetras(a: Azar): Borrador {
  const { int, pick } = a;
  for (;;) {
    const tipo = pick(["paso", "paso", "alterna", "creciente", "baja", "doble"]);
    let idx: number[] = [];
    let regla = "";
    let dificultad: 1 | 2 | 3 = 1;
    let extra: number[] = [];
    if (tipo === "paso") {
      const d = int(1, 4);
      const s = int(0, 26 - 5 * d);
      idx = Array.from({ length: 6 }, (_, i) => s + d * i);
      regla = `Cada letra está ${d === 1 ? "un lugar" : `${d} lugares`} después de la anterior`;
      extra = [idx[5] + d, idx[4]];
    } else if (tipo === "baja") {
      const d = int(1, 4);
      const s = int(5 * d, 26);
      idx = Array.from({ length: 6 }, (_, i) => s - d * i);
      regla = `Cada letra está ${d === 1 ? "un lugar" : `${d} lugares`} antes de la anterior`;
      extra = [idx[5] - d, idx[4]];
    } else if (tipo === "alterna") {
      const d1 = int(1, 3);
      const d2 = int(1, 3);
      const s1 = int(0, 26 - 3 * d1);
      const s2 = int(0, 26 - 3 * d2);
      idx = Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? s1 + d1 * (i / 2) : s2 + d2 * ((i - 1) / 2)));
      regla = `Son dos series alternas: ${idx.filter((_, i) => i % 2 === 0).map((i) => LETRAS[i]).join(", ")} (cada letra ${d1 === 1 ? "un lugar" : `${d1} lugares`} después) y ${idx.filter((_, i) => i % 2 === 1).map((i) => LETRAS[i]).join(", ")} (cada letra ${d2 === 1 ? "un lugar" : `${d2} lugares`} después)`;
      dificultad = 2;
      extra = [idx[6] + d1, idx[5] + d2];
    } else if (tipo === "creciente") {
      const s = int(0, 11);
      idx = [0, 1, 3, 6, 10, 15].map((o) => s + o);
      regla = "Los saltos van aumentando: 1, 2, 3, 4… lugares, y ahora toca un salto de 5";
      dificultad = 2;
      extra = [idx[4] + 4, idx[5] + 1];
    } else {
      const s = int(0, 17);
      regla = "Se alternan saltos de 1 y 2 lugares";
      idx = [s];
      for (let i = 0; i < 7; i++) idx.push(idx[i] + (i % 2 === 0 ? 1 : 2));
      dificultad = 2;
      extra = [idx[6] + 1, idx[6] + 3];
    }
    const mostrados = idx.length - 1;
    if (idx.some((v) => v < 0 || v > 26) || saltaEnye(idx)) continue;
    const siguiente = idx[mostrados];
    const otras = letrasVecinas(a, siguiente, extra);
    return {
      tipo: "serie-letras",
      tema: TEMA,
      articulo: "Series de letras",
      enunciado: `${ALFABETO}: ¿qué letra continúa la serie ${idx.slice(0, mostrados).map((i) => LETRAS[i]).join(", ")}, …?`,
      correcta: LETRAS[siguiente],
      otras,
      explicacion: `${regla}. La letra que sigue es la ${LETRAS[siguiente]}.`,
      dificultad,
    };
  }
}

const NOMBRES = ["Ana", "Luis", "Marta", "Pedro", "Lucía", "Carlos", "Elena", "Jorge", "Irene", "Pablo", "Sara", "Diego", "Laura", "Raúl", "Nuria", "Álvaro"];
const ORDINALES = ["primer", "segundo", "tercer", "cuarto"] as const;

export function ordenDePersonas(a: Azar): Borrador {
  const { pick, shuffle, int } = a;
  const personas = shuffle(NOMBRES).slice(0, 4); // personas[0] es la primera en llegar
  const verbo = pick([
    { antes: "llegó antes que", despues: "llegó después de", lugar: "llegó" },
    { antes: "terminó antes que", despues: "terminó después de", lugar: "terminó" },
  ]);
  const frases = shuffle(
    [0, 1, 2].map((i) =>
      a.rnd() < 0.5
        ? `${personas[i]} ${verbo.antes} ${personas[i + 1]}`
        : `${personas[i + 1]} ${verbo.despues} ${personas[i]}`,
    ),
  );
  const pos = int(0, 3);
  const dificultad = pos === 0 || pos === 3 ? 1 : 2;
  const ultimo = pos === 3;
  const pregunta = ultimo ? `¿Quién ${verbo.lugar} en último lugar?` : `¿Quién ${verbo.lugar} en ${ORDINALES[pos]} lugar?`;
  return {
    tipo: "orden",
    tema: TEMA,
    articulo: "Orden y posiciones",
    enunciado: `Cuatro personas ${verbo.lugar === "llegó" ? "llegan" : "terminan"} a horas distintas. ${frases.join(". ")}. ${pregunta}`,
    correcta: personas[pos],
    otras: personas.filter((_, i) => i !== pos),
    explicacion: `Ordenadas, ${personas[0]}, ${personas[1]}, ${personas[2]} y ${personas[3]} ${verbo.lugar === "llegó" ? "llegan" : "terminan"} en ese orden. ${["El primero", "El segundo", "El tercero", "El último"][pos]} es ${personas[pos]}.`,
    dificultad,
  };
}

function diaSemana(d: number) {
  return DIAS[((d % 7) + 7) % 7];
}

export function calendario(a: Azar): Borrador {
  const { int, pick } = a;
  const tipo = pick(["dentro", "hace", "relativo", "fecha"]);
  const dias = (centro: number, extra: number[] = []) => {
    const vistos = new Set<number>([((centro % 7) + 7) % 7]);
    const salida: string[] = [];
    for (const c of [...extra, centro + 1, centro - 1, centro + 2, centro - 2, centro + 3]) {
      const m = ((c % 7) + 7) % 7;
      if (vistos.has(m)) continue;
      vistos.add(m);
      salida.push(diaSemana(m));
    }
    return salida.slice(0, 3);
  };
  if (tipo === "dentro" || tipo === "hace") {
    const hoy = int(0, 6);
    let n = int(10, 100);
    if (n % 7 === 0) n++;
    const futuro = tipo === "dentro";
    const resultado = futuro ? hoy + n : hoy - n;
    const resto = n % 7;
    return {
      tipo: "calendario",
      tema: TEMA,
      articulo: "Calendario",
      enunciado: `Si hoy es ${diaSemana(hoy)}, ¿qué día de la semana ${futuro ? `será dentro de ${n} días` : `fue hace ${n} días`}?`,
      correcta: diaSemana(resultado),
      otras: dias(resultado, [futuro ? hoy + (n - resto) + resto + 1 : hoy - n - 1]),
      explicacion: `${n} días son ${Math.floor(n / 7)} semanas completas y ${resto} día${resto === 1 ? "" : "s"}. Las semanas no cambian el día; ${futuro ? "avanzando" : "retrocediendo"} ${resto} desde el ${diaSemana(hoy)} se llega al ${diaSemana(resultado)}.`,
      dificultad: n <= 30 ? 1 : n <= 60 ? 2 : 3,
    };
  }
  if (tipo === "relativo") {
    const nombres: Record<number, string> = { [-2]: "anteayer", [-1]: "ayer", 0: "hoy", 1: "mañana", 2: "pasado mañana" };
    const frase = (o: number, dia: string) => (o < 0 ? `Si ${nombres[o]} fue ${dia}` : `Si ${nombres[o]} es ${dia}`);
    const conocido = pick([-2, -1, 1, 2]);
    let preguntado = pick([-2, -1, 0, 1, 2]);
    while (preguntado === conocido) preguntado = pick([-2, -1, 0, 1, 2]);
    const dia = int(0, 6);
    const hoy = dia - conocido;
    const resultado = hoy + preguntado;
    const pregunta =
      preguntado === 0
        ? "¿qué día de la semana es hoy?"
        : preguntado < 0
          ? `¿qué día de la semana fue ${nombres[preguntado]}?`
          : `¿qué día de la semana será ${nombres[preguntado]}?`;
    return {
      tipo: "calendario",
      tema: TEMA,
      articulo: "Calendario",
      enunciado: `${frase(conocido, diaSemana(dia))}, ${pregunta}`,
      correcta: diaSemana(resultado),
      otras: dias(resultado, [dia + preguntado, hoy]),
      explicacion: `Si ${nombres[conocido]} ${conocido < 0 ? "fue" : "es"} ${diaSemana(dia)}, hoy es ${diaSemana(hoy)}. Desde ahí, ${preguntado === 0 ? "ese es el día de hoy" : `${nombres[preguntado]} ${preguntado < 0 ? "fue" : "será"} ${diaSemana(resultado)}`}.`,
      dificultad: Math.abs(preguntado - conocido) >= 3 ? 3 : 2,
    };
  }
  // Entre dos fechas reales de 2026.
  const mes = int(0, 10);
  const d1 = int(1, 28);
  const inicio = Date.UTC(2026, mes, d1);
  const salto = int(9, 40);
  const fin = new Date(inicio + salto * 86400000);
  const sem = (t: number) => new Date(t).getUTCDay();
  const diaFin = sem(fin.getTime());
  const otras = dias(diaFin, [sem(inicio + (salto - 1) * 86400000), sem(inicio + (salto + 1) * 86400000)]);
  const fecha = (t: number) => `${new Date(t).getUTCDate()} de ${MESES[new Date(t).getUTCMonth()]}`;
  return {
    tipo: "calendario",
    tema: TEMA,
    articulo: "Calendario",
    enunciado: `En 2026, el ${fecha(inicio)} cae en ${diaSemana(sem(inicio))}. ¿En qué día de la semana cae el ${fecha(fin.getTime())}?`,
    correcta: diaSemana(diaFin),
    otras,
    explicacion: `Del ${fecha(inicio)} al ${fecha(fin.getTime())} hay ${salto} días: ${Math.floor(salto / 7)} semanas completas y ${salto % 7} día${salto % 7 === 1 ? "" : "s"} más. Desde el ${diaSemana(sem(inicio))} se avanza hasta el ${diaSemana(diaFin)}.`,
    dificultad: 3,
  };
}

export function reloj(a: Azar): Borrador {
  const { int, pick } = a;
  for (;;) {
    const h = int(1, 12);
    const m = pick([0, 15, 30, 45]);
    const hora = (h % 12) * 30 + m * 0.5;
    const minuto = m * 6;
    let angulo = Math.abs(hora - minuto);
    if (angulo > 180) angulo = 360 - angulo;
    const ingenuo = Math.abs((h % 12) * 30 - minuto);
    const pistas = [ingenuo > 180 ? 360 - ingenuo : ingenuo, 360 - angulo, angulo + 15, angulo - 15, angulo + 30];
    const otras = distractoresNumericos(angulo, pistas, { entero: false, minimo: 0, maximo: 180 });
    if (otras.length < 3 || angulo === 0) continue;
    const fmt = (x: number) => `${cifra(x)}°`;
    const hh = `${h}:${String(m).padStart(2, "0")}`;
    return {
      tipo: "reloj",
      tema: TEMA,
      articulo: "Reloj",
      enunciado: `¿Qué ángulo forman las agujas de un reloj a las ${hh}?`,
      correcta: fmt(angulo),
      otras: otras.map(fmt),
      explicacion: `A las ${hh} la aguja de las horas está a ${cifra(hora)}° (${h % 12} × 30° más ${m} × 0,5°) y la de los minutos a ${minuto}° (${m} × 6°). La diferencia es ${cifra(angulo)}°.`,
      dificultad: m === 0 ? 1 : m === 30 ? 2 : 3,
    };
  }
}

const TRIPLETAS = [
  ["A", "B", "C"],
  ["M", "N", "P"],
  ["X", "Y", "Z"],
  ["R", "S", "T"],
  ["D", "E", "F"],
];

export function silogismo(a: Azar, tipo: number): Borrador {
  const { pick, shuffle } = a;
  const [A, B, C] = pick(TRIPLETAS);
  const individuo = pick(["Marta", "Luis", "Carlos", "Elena", "Pablo", "Lucía"]);
  const tabla: { premisas: string; conclusion: string; otras: string[]; por: string; dificultad: 1 | 2 | 3 }[] = [
    {
      premisas: `Todos los ${A} son ${B}. Todos los ${B} son ${C}`,
      conclusion: `Todos los ${A} son ${C}`,
      otras: [`Todos los ${C} son ${A}`, `Ningún ${A} es ${C}`, `Algunos ${C} no son ${B}`],
      por: `Si todos los ${A} son ${B} y todos los ${B} son ${C}, entonces todos los ${A} son ${C}. Lo contrario (todos los ${C} son ${A}) no se deduce.`,
      dificultad: 1,
    },
    {
      premisas: `Todos los ${A} son ${B}. ${individuo} es ${A}`,
      conclusion: `${individuo} es ${B}`,
      otras: [`${individuo} no es ${B}`, `Todos los ${B} son ${A}`, `${individuo} es ${A} pero no ${B}`],
      por: `${individuo} pertenece a ${A}, y todo ${A} es ${B}; por tanto ${individuo} es ${B}. Que todos los ${B} sean ${A} no se deduce.`,
      dificultad: 1,
    },
    {
      premisas: `Ningún ${A} es ${B}. ${individuo} es ${A}`,
      conclusion: `${individuo} no es ${B}`,
      otras: [`${individuo} es ${B}`, `Todos los ${B} son ${A}`, `Algunos ${B} son ${A}`],
      por: `Como ningún ${A} es ${B} y ${individuo} es ${A}, ${individuo} no puede ser ${B}.`,
      dificultad: 2,
    },
    {
      premisas: `Algunos ${A} son ${B}. Todos los ${B} son ${C}`,
      conclusion: `Algunos ${A} son ${C}`,
      otras: [`Todos los ${A} son ${C}`, `Ningún ${A} es ${C}`, `Todos los ${C} son ${B}`],
      por: `Los ${A} que son ${B} son también ${C}, así que algunos ${A} son ${C}. No se puede afirmar que todos lo sean.`,
      dificultad: 3,
    },
    {
      premisas: `Todos los ${A} son ${B}. Ningún ${C} es ${B}`,
      conclusion: `Ningún ${C} es ${A}`,
      otras: [`Todos los ${C} son ${A}`, `Algunos ${C} son ${A}`, `Todos los ${A} son ${C}`],
      por: `Todo ${A} es ${B} y ningún ${C} es ${B}; luego ningún ${C} puede ser ${A}.`,
      dificultad: 3,
    },
    {
      premisas: `Todos los ${A} son ${B}. Algunos ${C} son ${A}`,
      conclusion: `Algunos ${C} son ${B}`,
      otras: [`Todos los ${C} son ${B}`, `Ningún ${C} es ${B}`, `Todos los ${B} son ${C}`],
      por: `Los ${C} que son ${A} son también ${B}, así que algunos ${C} son ${B}. No se deduce que todos lo sean.`,
      dificultad: 2,
    },
  ];
  const t = tabla[tipo % tabla.length];
  return {
    tipo: "silogismo",
    tema: TEMA,
    articulo: "Silogismos",
    enunciado: `${t.premisas}. ¿Qué conclusión se deduce con seguridad?`,
    correcta: t.conclusion,
    otras: shuffle(t.otras).slice(0, 3),
    explicacion: t.por,
    dificultad: t.dificultad,
  };
}

export function problemaLogico(a: Azar, tipo: number): Borrador {
  const { int, pick } = a;
  switch (tipo % 7) {
    case 0: {
      const k = pick([2, 3, 4]);
      const luis = int(5, 20);
      const total = luis * (k + 1);
      const quien = pick([["Ana", "Luis"], ["Elena", "Pablo"], ["Marta", "Jorge"]]);
      const otras = distractoresNumericos(luis, [total - luis, total / 2, luis * k], { minimo: 1 });
      return {
        tipo: "problema",
        tema: TEMA,
        articulo: "Problemas de lógica",
        enunciado: `${quien[0]} tiene ${k === 2 ? "el doble" : k === 3 ? "el triple" : "el cuádruple"} de edad que ${quien[1]}, y entre los dos suman ${total} años. ¿Cuántos años tiene ${quien[1]}?`,
        correcta: cifra(luis),
        otras: otras.map(cifra),
        explicacion: `Si ${quien[1]} tiene una parte, ${quien[0]} tiene ${k} y juntos ${k + 1} partes. Cada parte vale ${total} ÷ ${k + 1} = ${luis}, así que ${quien[1]} tiene ${luis} años.`,
        dificultad: 2,
      };
    }
    case 1: {
      for (;;) {
        const x = int(3, 30);
        const k = pick([2, 3]);
        const suma = int(5, 20);
        const resta = (k - 1) * x - suma;
        if (resta <= 0 || resta > 60) continue;
        const otras = distractoresNumericos(x, [x + 5, x - 5, suma + resta], { minimo: 1 });
        return {
          tipo: "problema",
          tema: TEMA,
          articulo: "Problemas de lógica",
          enunciado: `Un número aumentado en ${suma} da lo mismo que su ${k === 2 ? "doble" : "triple"} disminuido en ${resta}. ¿Cuál es el número?`,
          correcta: cifra(x),
          otras: otras.map(cifra),
          explicacion: `Con ${x}: ${x} + ${suma} = ${x + suma} y ${k} × ${x} − ${resta} = ${k * x - resta}. Los dos resultados coinciden.`,
          dificultad: 3,
        };
      }
    }
    case 2: {
      const x = 2 * int(6, 40);
      const suma = int(3, 20);
      const r = x / 2 + suma;
      const otras = distractoresNumericos(x, [r - suma, 2 * r, r + suma], { minimo: 1 });
      return {
        tipo: "problema",
        tema: TEMA,
        articulo: "Problemas de lógica",
        enunciado: `Si a la mitad de un número se le suman ${suma}, se obtiene ${r}. ¿Cuál es el número?`,
        correcta: cifra(x),
        otras: otras.map(cifra),
        explicacion: `La mitad del número es ${r} − ${suma} = ${r - suma}, así que el número es el doble: ${x}.`,
        dificultad: 2,
      };
    }
    case 3: {
      const y = int(4, 15);
      const total = 3 * y;
      const otras = distractoresNumericos(y, [2 * y, total / 2, total - 2], { minimo: 1 });
      return {
        tipo: "problema",
        tema: TEMA,
        articulo: "Problemas de lógica",
        enunciado: `En un servicio trabajan ${total} personas y los hombres son el doble que las mujeres. ¿Cuántas mujeres hay?`,
        correcta: cifra(y),
        otras: otras.map(cifra),
        explicacion: `Las mujeres son una parte y los hombres dos, así que hay 3 partes en total. Cada parte vale ${total} ÷ 3 = ${y}: hay ${y} mujeres.`,
        dificultad: 2,
      };
    }
    case 4: {
      for (;;) {
        const total = pick([300, 400, 500, 600, 700, 800, 1000, 1200]);
        const d = pick([100, 150, 200, 250, 300, 400, 450, 500]);
        if (d >= total || (total - d) % 2 !== 0) continue;
        const impresora = (total - d) / 2;
        const otras = distractoresNumericos(impresora, [total - d, d / 2, total / 2], { minimo: 1 });
        return {
          tipo: "problema",
          tema: TEMA,
          articulo: "Problemas de lógica",
          enunciado: `Un ordenador y una impresora cuestan juntos ${euros(total)}, y el ordenador cuesta ${euros(d)} más que la impresora. ¿Cuánto cuesta la impresora?`,
          correcta: euros(impresora),
          otras: otras.map(euros),
          explicacion: `Si a ${euros(total)} se le quitan los ${euros(d)} de diferencia, quedan ${euros(total - d)}, que son dos impresoras. Una impresora cuesta ${euros(impresora)} y el ordenador ${euros(impresora + d)}.`,
          dificultad: 3,
        };
      }
    }
    case 5: {
      const v = pick([40, 50, 60, 70, 80, 90]);
      const horas = pick([2, 3, 4, 5]);
      const t0 = pick([1.5, 2, 2.5]);
      const dist = v * t0;
      const r = v * horas;
      const otras = distractoresNumericos(r, [dist + horas * 10, dist * horas, r + v], { minimo: 1 });
      return {
        tipo: "problema",
        tema: TEMA,
        articulo: "Problemas de lógica",
        enunciado: `Un autobús recorre ${cifra(dist)} km en ${t0 === 1.5 ? "1 hora y 30 minutos" : t0 === 2 ? "2 horas" : "2 horas y 30 minutos"}. A la misma velocidad, ¿cuántos kilómetros recorrerá en ${horas} horas?`,
        correcta: `${cifra(r)} km`,
        otras: otras.map((x) => `${cifra(x)} km`),
        explicacion: `La velocidad es ${cifra(dist)} km ÷ ${cifra(t0)} h = ${v} km/h. En ${horas} horas recorre ${v} × ${horas} = ${r} km.`,
        dificultad: 2,
      };
    }
    default: {
      const n = int(3, 6);
      const cada = int(4, 9);
      const total = n * cada;
      const extra = int(2, 4);
      const r = total + extra * cada;
      const otras = distractoresNumericos(r, [total + extra, total * extra, r - cada], { minimo: 1 });
      return {
        tipo: "problema",
        tema: TEMA,
        articulo: "Problemas de lógica",
        enunciado: `Cada una de ${n} mesas tiene ${cada} sillas. Si se añaden ${extra} mesas iguales, ¿cuántas sillas habrá en total?`,
        correcta: cifra(r),
        otras: otras.map(cifra),
        explicacion: `Habrá ${n} + ${extra} = ${n + extra} mesas con ${cada} sillas cada una: ${n + extra} × ${cada} = ${r} sillas.`,
        dificultad: 1,
      };
    }
  }
}

const PALABRAS_SUMA = ["PLAZO", "OFICIO", "FIRMA", "SELLO", "ACTA", "ORDEN", "COPIA", "REGISTRO", "TRAMITE", "NORMA", "ARCHIVO", "TASA"];
const PALABRAS_CODIGO = ["ACTA", "LEY", "SELLO", "FIRMA", "NOTA", "OFICIO", "ARCHIVO", "EXPEDIENTE", "REGISTRO", "CARTA", "ORDEN", "COPIA"];

export function codificacion(a: Azar, tipo: number): Borrador {
  const { pick, shuffle } = a;
  const pos = (c: string) => LETRAS.indexOf(c) + 1;
  if (tipo % 3 === 0) {
    const palabra = pick(PALABRAS_SUMA);
    const suma = [...palabra].reduce((s, c) => s + pos(c), 0);
    const con26 = [...palabra].reduce((s, c) => s + (pos(c) > 14 ? pos(c) - 1 : pos(c)), 0);
    const otras = distractoresNumericos(suma, [con26, suma + 1, suma - 2], { minimo: 1 });
    return {
      tipo: "codigo",
      tema: TEMA,
      articulo: "Codificación",
      enunciado: `Si cada letra vale su posición en el alfabeto español de 27 letras (A = 1, B = 2, … N = 14, Ñ = 15, O = 16…), ¿cuánto suman las letras de «${palabra}»?`,
      correcta: cifra(suma),
      otras: otras.map(cifra),
      explicacion: `${[...palabra].map((c) => `${c} = ${pos(c)}`).join(", ")}. La suma es ${suma}.`,
      dificultad: 2,
    };
  }
  if (tipo % 3 === 1) {
    const palabra = pick(PALABRAS_CODIGO);
    const mover = (c: string, d: number) => LETRAS[(LETRAS.indexOf(c) + d + 27) % 27];
    const cod = (d: number) => [...palabra].map((c) => mover(c, d)).join("");
    const correcta = cod(1);
    const candidatas = [cod(2), cod(-1), [...correcta].reverse().join(""), cod(3)];
    const otras = [...new Set(candidatas.filter((c) => c !== correcta))].slice(0, 3);
    return {
      tipo: "codigo",
      tema: TEMA,
      articulo: "Codificación",
      enunciado: `En un código cada letra se sustituye por la siguiente del alfabeto español de 27 letras (A → B, B → C, … N → Ñ, Ñ → O…). ¿Cómo se escribe «${palabra}»?`,
      correcta,
      otras: shuffle(otras),
      explicacion: `Cada letra se cambia por la siguiente: ${[...palabra].map((c) => `${c} → ${mover(c, 1)}`).join(", ")}. Se escribe ${correcta}.`,
      dificultad: 2,
    };
  }
  const n = a.int(4, 26);
  const r = LETRAS[n - 1];
  const otras = letrasVecinas(a, n - 1, []);
  return {
    tipo: "codigo",
    tema: TEMA,
    articulo: "Codificación",
    enunciado: `¿Qué letra ocupa el lugar ${n} en el alfabeto español de 27 letras (A, B, C… con la Ñ entre la N y la O)?`,
    correcta: r,
    otras,
    explicacion: `Contando desde la A, que es la 1.ª, el lugar ${n} corresponde a la ${r}. (Con la Ñ en el lugar 15, la O es la 16.ª y la Z, la 27.ª.)`,
    dificultad: n < 14 ? 1 : 2,
  };
}
