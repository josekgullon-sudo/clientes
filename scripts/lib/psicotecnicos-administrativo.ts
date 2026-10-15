/** Aptitud administrativa (tema 31): ordenar, comparar y comprobar datos, plazos y horarios. */
import { DIAS, LETRAS_DNI, MESES, cifra, distractoresNumericos, type Borrador, type crearAzar } from "./psicotecnicos-base";

type Azar = ReturnType<typeof crearAzar>;
const TEMA = 31;

// ———————— Ordenación alfabética ————————

const APELLIDOS: Record<string, string[]> = {
  A: ["Aguilar", "Alonso", "Álvarez", "Arias"],
  B: ["Benítez", "Blanco", "Bravo"],
  C: ["Caballero", "Cabrera", "Calvo", "Campos", "Cano", "Carmona", "Carrasco", "Castillo", "Castro", "Cortés", "Crespo", "Cruz"],
  D: ["Delgado", "Díaz", "Díez", "Domínguez", "Durán"],
  G: ["Gallardo", "Gallego", "García", "Garrido", "Gil", "Giménez", "Gómez", "González", "Guerrero", "Gutiérrez"],
  H: ["Hernández", "Herrera", "Herrero", "Hidalgo"],
  L: ["León", "López", "Lorenzo", "Lozano"],
  M: ["Marín", "Márquez", "Martín", "Martínez", "Medina", "Méndez", "Molina", "Montero", "Mora", "Morales", "Moreno", "Moya"],
  N: ["Navarro", "Nieto", "Núñez"],
  P: ["Parra", "Pascual", "Pastor", "Peña", "Pérez", "Prieto"],
  R: ["Ramírez", "Ramos", "Reyes", "Rivera", "Rodríguez", "Rojas", "Román", "Romero", "Rubio", "Ruiz"],
  S: ["Sáez", "Sánchez", "Santana", "Santiago", "Santos", "Sanz", "Serrano", "Soler", "Soto", "Suárez"],
};

const clave = (t: string) =>
  t
    .toLowerCase()
    .replace(/ñ/g, "n{") // la Ñ va después de la N
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function ordenAlfabetico(a: Azar, nOrden: number): Borrador {
  const { pick, shuffle } = a;
  const inicial = pick(Object.keys(APELLIDOS).filter((k) => APELLIDOS[k].length >= 5));
  const cuatro = shuffle(APELLIDOS[inicial]).slice(0, 4);
  const ordenados = [...cuatro].sort((x, y) => (clave(x) < clave(y) ? -1 : 1));
  const lugar = [0, 3, 1, 2][nOrden % 4];
  const nombres = ["primer", "segundo", "tercer", "último"];
  const ordinal = ["El primero", "El segundo", "El tercero", "El último"][lugar];
  const lista = `${cuatro.slice(0, -1).join(", ")} y ${cuatro[3]}`;
  return {
    tipo: "alfabetico",
    tema: TEMA,
    articulo: "Ordenación alfabética",
    enunciado: `Se ordenan alfabéticamente los apellidos ${lista}. ¿Cuál queda ${lugar === 3 ? "en último lugar" : `en ${nombres[lugar]} lugar`}?`,
    correcta: ordenados[lugar],
    otras: ordenados.filter((_, i) => i !== lugar),
    explicacion: `Se compara letra a letra, sin tener en cuenta las tildes. Ordenados quedan: ${ordenados.join(", ")}. ${ordinal} es ${ordenados[lugar]}.`,
    dificultad: lugar === 0 || lugar === 3 ? 1 : 2,
  };
}

// ———————— Comparación de códigos ————————

const LETRAS_COD = "ABCDEFGHJKMNPRSTUVWXYZ".split("");

export function comparaCodigos(a: Azar): Borrador {
  const { int, pick, shuffle } = a;
  const largo = pick([5, 6]);
  const nuevoCodigo = () =>
    `${pick(LETRAS_COD)}${pick(LETRAS_COD)}-${Array.from({ length: largo }, (_, i) => (i === 0 ? int(1, 9) : int(0, 9))).join("")}`;
  const alterar = (codigo: string, como: string): string => {
    const [pref, num] = codigo.split("-");
    const d = [...num];
    if (como === "intercambio") {
      for (let i = 0; i < 10; i++) {
        const k = int(0, d.length - 2);
        if (d[k] !== d[k + 1]) {
          [d[k], d[k + 1]] = [d[k + 1], d[k]];
          return `${pref}-${d.join("")}`;
        }
      }
      d[d.length - 1] = String((Number(d[d.length - 1]) + 1) % 10);
      return `${pref}-${d.join("")}`;
    }
    if (como === "cifra") {
      const k = int(0, d.length - 1);
      d[k] = String((Number(d[k]) + int(1, 8)) % 10);
      if (k === 0 && d[0] === "0") d[0] = "1";
      return `${pref}-${d.join("")}`;
    }
    if (como === "letra") {
      const otra = pick(LETRAS_COD.filter((l) => l !== pref[1]));
      return `${pref[0]}${otra}-${num}`;
    }
    return `${pref}-${num}${d[d.length - 1]}`; // una cifra de más
  };
  for (;;) {
    const tipos = shuffle(["intercambio", "cifra", "letra", "sobra"]).slice(0, 3);
    const base = [nuevoCodigo(), nuevoCodigo(), nuevoCodigo(), nuevoCodigo()];
    const iguales = `${base[0]} / ${base[0]}`;
    const otras = tipos.map((t, i) => {
      const alt = alterar(base[i + 1], t);
      return a.rnd() < 0.5 ? `${base[i + 1]} / ${alt}` : `${alt} / ${base[i + 1]}`;
    });
    if (otras.some((o) => o.split(" / ")[0] === o.split(" / ")[1])) continue;
    return {
      tipo: "codigos",
      tema: TEMA,
      articulo: "Comparación de códigos",
      enunciado: "¿En cuál de las siguientes parejas los dos códigos son exactamente iguales?",
      correcta: iguales,
      otras,
      explicacion: `En ${iguales} los dos códigos coinciden carácter a carácter. En las otras parejas hay una diferencia: dos cifras cambiadas de sitio, una cifra distinta, una letra distinta o una cifra de más.`,
      dificultad: largo === 5 ? 1 : 2,
    };
  }
}

// ———————— Letra del DNI ————————

export function letraDni(a: Azar): Borrador {
  const { int } = a;
  const n = int(10000000, 99999999);
  const r = n % 23;
  const correcta = LETRAS_DNI[r];
  const otras = [LETRAS_DNI[(r + 1) % 23], LETRAS_DNI[(r + 22) % 23], LETRAS_DNI[(r + 2) % 23]];
  const tabla = [...LETRAS_DNI].map((l, i) => `${i} ${l}`).join(", ");
  return {
    tipo: "dni",
    tema: TEMA,
    articulo: "Comprobación de datos",
    enunciado: `La letra del DNI se obtiene dividiendo el número entre 23 y buscando el resto en esta tabla: ${tabla}. ¿Qué letra corresponde al DNI ${n}?`,
    correcta,
    otras,
    explicacion: `Al dividir ${n} entre 23 el resto es ${r}. En la tabla, el resto ${r} corresponde a la letra ${correcta}.`,
    dificultad: 3,
  };
}

// ———————— Plazos administrativos ————————

const DIA = 86400000;
const fechaTexto = (t: number) => {
  const d = new Date(t);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
};
const esFinDeSemana = (t: number) => [0, 6].includes(new Date(t).getUTCDay());

/** Festivos nacionales de 2026: se evitan para que la frase «si no hay festivos» no choque con el calendario real. */
const FESTIVOS_2026 = ["2026-01-01", "2026-01-06", "2026-04-03", "2026-05-01", "2026-08-15", "2026-10-12", "2026-11-01", "2026-12-06", "2026-12-08", "2026-12-25"].map((d) => Date.parse(d));
const hayFestivo = (desde: number, hasta: number) => FESTIVOS_2026.some((f) => f >= desde && f <= hasta);

function sumaHabiles(inicio: number, n: number) {
  let t = inicio;
  let hechos = 0;
  while (hechos < n) {
    t += DIA;
    if (!esFinDeSemana(t)) hechos++;
  }
  return t;
}

export function plazo(a: Azar, nPlazo: number): Borrador {
  const { int, pick } = a;
  const porMeses = nPlazo >= 5;
  if (!porMeses) {
    for (;;) {
      const mes = pick([1, 2, 5, 6, 8]);
      const inicio = Date.UTC(2026, mes, int(1, 28));
      const n = pick([5, 8, 10, 12, 15, 20]);
      const fin = sumaHabiles(inicio, n);
      if (hayFestivo(inicio, fin + 2 * DIA)) continue;
      const posibles = [sumaHabiles(inicio, n + 1), sumaHabiles(inicio, n - 1), inicio + n * DIA];
      const otras = [...new Set(posibles.filter((t) => t !== fin).map(fechaTexto))];
      if (otras.length < 3 || otras.includes(fechaTexto(fin))) continue;
      return {
        tipo: "plazo",
        tema: TEMA,
        articulo: "Plazos administrativos",
        enunciado: `Una resolución se notifica el ${fechaTexto(inicio)} de 2026. Para recurrir hay ${n} días hábiles. Si no hay festivos en ese periodo, ¿cuándo termina el plazo?`,
        correcta: fechaTexto(fin),
        otras: otras.slice(0, 3),
        explicacion: `Según el artículo 30 de la Ley 39/2015, los plazos en días hábiles se cuentan desde el día siguiente a la notificación y excluyen sábados, domingos y festivos. Contando ${n} días hábiles desde el ${fechaTexto(inicio)}, el plazo termina el ${fechaTexto(fin)}.`,
        dificultad: n >= 12 ? 3 : 2,
      };
    }
  }
  for (;;) {
    const mesInicio = int(0, 8);
    const dia = int(1, 31);
    const diasDelMes = new Date(Date.UTC(2026, mesInicio + 1, 0)).getUTCDate();
    if (dia > diasDelMes) continue;
    const meses = pick([1, 2, 3]);
    const mesFin = mesInicio + meses;
    const diasFin = new Date(Date.UTC(2026, mesFin + 1, 0)).getUTCDate();
    const diaFin = Math.min(dia, diasFin);
    const exacto = Date.UTC(2026, mesFin, diaFin);
    let fin = exacto;
    while (esFinDeSemana(fin)) fin += DIA;
    const inicio = Date.UTC(2026, mesInicio, dia);
    if (hayFestivo(exacto - 2 * DIA, fin + 2 * DIA)) continue;
    const posibles = [exacto - DIA, exacto + DIA, inicio + meses * 30 * DIA, fin + DIA, exacto];
    const otras = [...new Set(posibles.filter((t) => t !== fin).map(fechaTexto))];
    if (otras.length < 3) continue;
    const ajusteFinde = fin !== exacto;
    const ajusteMes = diaFin !== dia;
    const nombreMeses = meses === 1 ? "un mes" : meses === 2 ? "dos meses" : "tres meses";
    return {
      tipo: "plazo",
      tema: TEMA,
      articulo: "Plazos administrativos",
      enunciado: `Un acto se notifica el ${fechaTexto(inicio)} de 2026 y el plazo para recurrirlo es de ${nombreMeses}. Si no hay festivos, ¿cuándo termina el plazo?`,
      correcta: fechaTexto(fin),
      otras: otras.slice(0, 3),
      explicacion: `Según el artículo 30 de la Ley 39/2015, los plazos en meses se cuentan de fecha a fecha: terminan el mismo día del mes de vencimiento${ajusteMes ? `; como en ese mes no existe el día ${dia}, termina el último día del mes (${fechaTexto(exacto)})` : ` (${fechaTexto(exacto)})`}.${ajusteFinde ? " Como ese día es sábado o domingo, el plazo se prorroga al primer día hábil siguiente." : ""} Termina el ${fechaTexto(fin)}.`,
      dificultad: ajusteFinde || ajusteMes ? 3 : 2,
    };
  }
}

// ———————— Horarios ————————

const hm = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : h === 0 ? `${m} min` : `${h} h ${m} min`;
};
const textoHoras = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} horas` : `${h} horas y ${m} minutos`;
};
const reloj = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;

function tresDistintas(correcta: string, candidatas: string[]) {
  return [...new Set(candidatas.filter((c) => c !== correcta))].slice(0, 3);
}

export function horario(a: Azar, tipo: number): Borrador {
  const { int, pick } = a;
  switch (tipo % 6) {
    case 0:
    case 1: {
      const entrada = pick([7 * 60 + 30, 8 * 60, 8 * 60 + 15, 8 * 60 + 30, 9 * 60]);
      const salida = pick([14 * 60 + 30, 15 * 60, 15 * 60 + 15, 15 * 60 + 45, 17 * 60]);
      const pausa = pick([30, 45]);
      const neto = salida - entrada - pausa;
      const otras = tresDistintas(hm(neto), [hm(neto + pausa), hm(neto - 15), hm(neto + 15), hm(neto - pausa)]);
      return {
        tipo: "horario",
        tema: TEMA,
        articulo: "Horarios y jornadas",
        enunciado: `Una persona entra a las ${reloj(entrada)} y sale a las ${reloj(salida)}. Si tiene ${pausa} minutos de descanso que no cuentan como trabajo, ¿cuánto tiempo trabaja?`,
        correcta: hm(neto),
        otras,
        explicacion: `De ${reloj(entrada)} a ${reloj(salida)} pasan ${hm(salida - entrada)}. Restando ${pausa} minutos de descanso quedan ${hm(neto)} de trabajo.`,
        dificultad: 2,
      };
    }
    case 2: {
      const tasa = pick([8, 10, 12, 16, 20]);
      const minutos = pick([150, 180, 210, 240, 270, 330]);
      const total = (tasa * minutos) / 60;
      const horas = Math.floor(minutos / 60);
      const otras = distractoresNumericos(total, [tasa * horas, tasa * Math.ceil(minutos / 60), total + tasa / 2], { minimo: 1 });
      return {
        tipo: "horario",
        tema: TEMA,
        articulo: "Horarios y jornadas",
        enunciado: `Una ventanilla atiende a ${tasa} personas por hora. ¿Cuántas atenderá en una mañana de ${textoHoras(minutos)}?`,
        correcta: cifra(total),
        otras: otras.map(cifra),
        explicacion: `${hm(minutos)} son ${cifra(minutos / 60)} horas, y ${tasa} personas por hora × ${cifra(minutos / 60)} horas = ${cifra(total)} personas.`,
        dificultad: 2,
      };
    }
    case 3: {
      const horas1 = pick([2, 3, 4]);
      const k = pick([10, 12, 15, 20, 25]);
      const n1 = k * horas1;
      const h2 = pick([3, 4, 5, 6]) + (k % 2 === 0 ? pick([0, 0.5]) : 0);
      const n2 = k * h2;
      const min = h2 * 60;
      const otras = tresDistintas(hm(min), [hm(min + 30), hm(min - 30), hm(min + 60), hm(min - 60)]);
      return {
        tipo: "horario",
        tema: TEMA,
        articulo: "Horarios y jornadas",
        enunciado: `Clasificar ${n1} expedientes lleva ${horas1} horas. A ese ritmo, ¿cuánto se tardará en clasificar ${cifra(n2)}?`,
        correcta: hm(min),
        otras,
        explicacion: `El ritmo es ${n1} ÷ ${horas1} = ${k} expedientes por hora. Para ${cifra(n2)} hacen falta ${cifra(n2)} ÷ ${k} = ${cifra(h2)} horas, es decir, ${hm(min)}.`,
        dificultad: 2,
      };
    }
    case 4: {
      const d = pick([10, 15, 20, 30]);
      const citas = int(8, 24);
      const inicio = pick([8 * 60 + 30, 9 * 60]);
      const fin = inicio + citas * d;
      const otras = distractoresNumericos(citas, [citas + 1, citas - 1, citas + 2], { minimo: 1 });
      return {
        tipo: "horario",
        tema: TEMA,
        articulo: "Horarios y jornadas",
        enunciado: `Las citas duran ${d} minutos y se dan seguidas, sin pausas, desde las ${reloj(inicio)} hasta las ${reloj(fin)}. ¿Cuántas citas se pueden dar?`,
        correcta: cifra(citas),
        otras: otras.map(cifra),
        explicacion: `De ${reloj(inicio)} a ${reloj(fin)} hay ${hm(fin - inicio)}, es decir, ${fin - inicio} minutos. ${fin - inicio} ÷ ${d} = ${citas} citas.`,
        dificultad: 1,
      };
    }
    default: {
      if (a.rnd() < 0.5) {
        const semana = pick([35, 37.5, 40]);
        const diaria = (semana * 60) / 5;
        const otras = tresDistintas(hm(diaria), [hm(diaria + 30), hm(diaria - 30), hm(diaria + 15), hm(diaria - 15)]);
        return {
          tipo: "horario",
          tema: TEMA,
          articulo: "Horarios y jornadas",
          enunciado: `Si la jornada semanal es de ${cifra(semana)} horas, repartidas en 5 días iguales, ¿cuánto dura cada jornada diaria?`,
          correcta: hm(diaria),
          otras,
          explicacion: `${cifra(semana)} horas ÷ 5 días = ${cifra(semana / 5)} horas al día, es decir, ${hm(diaria)}.`,
          dificultad: 1,
        };
      }
      const diaria = pick([7 * 60, 7 * 60 + 30, 8 * 60]);
      const semanas = pick([3, 4, 6]);
      const total = (diaria * 5 * semanas) / 60;
      const otras = distractoresNumericos(total, [total + 5, total - 5, (diaria * 7 * semanas) / 60], { minimo: 1, entero: false });
      return {
        tipo: "horario",
        tema: TEMA,
        articulo: "Horarios y jornadas",
        enunciado: `Una persona trabaja ${hm(diaria)} al día, de lunes a viernes. ¿Cuántas horas trabaja en ${semanas} semanas?`,
        correcta: `${cifra(total)} h`,
        otras: otras.map((x) => `${cifra(x)} h`),
        explicacion: `En cada semana trabaja 5 × ${hm(diaria)} = ${hm(diaria * 5)}. En ${semanas} semanas, ${cifra(total)} horas.`,
        dificultad: 2,
      };
    }
  }
}

// ———————— Ordenación numérica ————————

export function ordenNumerico(a: Azar, nOrden: number): Borrador {
  const { int, pick } = a;
  for (;;) {
    const nums = Array.from({ length: 4 }, () => `${pick([2023, 2024, 2025])}${String(int(100, 1999)).padStart(4, "0")}`);
    if (new Set(nums).size < 4) continue;
    const ord = [...nums].sort((x, y) => Number(x) - Number(y));
    const lugar = [0, 3, 1, 2][nOrden % 4];
    const nombres = ["primer", "segundo", "tercer", "último"];
    return {
      tipo: "orden-num",
      tema: TEMA,
      articulo: "Ordenación numérica",
      enunciado: `Se ordenan de menor a mayor estos números de registro: ${nums.slice(0, -1).join(", ")} y ${nums[3]}. ¿Cuál queda ${lugar === 3 ? "en último lugar" : `en ${nombres[lugar]} lugar`}?`,
      correcta: ord[lugar],
      otras: ord.filter((_, i) => i !== lugar),
      explicacion: `Ordenados de menor a mayor: ${ord.join(", ")}. ${["El primero", "El segundo", "El tercero", "El último"][lugar]} es ${ord[lugar]}.`,
      dificultad: lugar === 0 || lugar === 3 ? 1 : 2,
    };
  }
}
