/** Aptitud numérica (tema 29): series de números y cálculo. La respuesta sale de la cuenta, no de la memoria. */
import { cifra, distractoresNumericos, euros, type Borrador, type crearAzar, type Dificultad } from "./psicotecnicos-base";

type Azar = ReturnType<typeof crearAzar>;

type Serie = {
  /** Todos los términos, incluido el que se pregunta. */
  todos: number[];
  regla: string;
  dificultad: Dificultad;
  /** Respuestas equivocadas típicas cuando se pide el siguiente. */
  pistas: number[];
  /** Admite preguntar por un término intermedio. */
  intermedio?: boolean;
};

const TEMA = 29;

function serie(a: Azar, familia: string): Serie {
  const { int, pick } = a;
  switch (familia) {
    case "aritmetica": {
      const ini = int(1, 40);
      const d = int(2, 12);
      const todos = Array.from({ length: 6 }, (_, i) => ini + d * i);
      return {
        todos,
        regla: `Cada término es el anterior más ${d}`,
        dificultad: 1,
        pistas: [todos[5] + d, todos[4], todos[5] + 1],
        intermedio: true,
      };
    }
    case "decreciente": {
      const ini = int(70, 130);
      const d = int(3, 9);
      const todos = Array.from({ length: 6 }, (_, i) => ini - d * i);
      return {
        todos,
        regla: `Cada término es el anterior menos ${d}`,
        dificultad: 1,
        pistas: [todos[5] - d, todos[4], todos[5] + d],
        intermedio: true,
      };
    }
    case "geometrica": {
      const ini = int(1, 5);
      const r = pick([2, 3]);
      const todos = Array.from({ length: 6 }, (_, i) => ini * r ** i);
      const u = todos[4];
      return {
        todos,
        regla: `Cada término es el anterior multiplicado por ${r}`,
        dificultad: r === 2 ? 1 : 2,
        pistas: [u + (u - todos[3]), u * (r + 1), todos[5] + ini],
        intermedio: true,
      };
    }
    case "geometrica-decreciente": {
      const r = pick([2, 3]);
      const k = pick([1, 2, 3, 5]);
      const todos = Array.from({ length: 6 }, (_, i) => k * r ** (5 - i));
      return {
        todos,
        regla: `Cada término es el anterior dividido entre ${r}`,
        dificultad: 2,
        pistas: [todos[4] - (todos[3] - todos[4]), todos[4] - r, todos[4] - 1],
      };
    }
    case "alterna": {
      const a1 = int(1, 20);
      const d1 = int(2, 6);
      const b1 = int(30, 60);
      const d2 = pick([-1, 1]) * int(2, 6);
      const todos = Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? a1 + d1 * (i / 2) : b1 + d2 * ((i - 1) / 2)));
      const signo = d2 > 0 ? "más" : "menos";
      return {
        todos,
        regla: `Son dos series alternas: los lugares impares suman ${d1} cada vez (${todos[0]}, ${todos[2]}, ${todos[4]}, ${todos[6]}) y los pares restan o suman ${Math.abs(d2)}: ${todos[1]}, ${todos[3]}, ${todos[5]}, ${todos[7]} (cada uno es el anterior ${signo} ${Math.abs(d2)})`,
        dificultad: 2,
        pistas: [todos[6] + d1, todos[5] + d2 + d1, todos[6] + d2],
      };
    }
    case "diferencias": {
      const ini = int(1, 10);
      const paso = pick([1, 1, 2]);
      const d0 = int(1, 3);
      const todos = [ini];
      for (let i = 0; i < 6; i++) todos.push(todos[i] + d0 + paso * i);
      const dif = todos.slice(1).map((t, i) => t - todos[i]);
      return {
        todos,
        regla: `Las diferencias entre términos van aumentando de ${paso} en ${paso}: ${dif.slice(0, 5).join(", ")}…, así que sigue +${dif[5]}`,
        dificultad: 2,
        pistas: [todos[5] + dif[4], todos[5] + dif[5] + paso, todos[5] + dif[5] - 1],
      };
    }
    case "cuadrados": {
      const n = int(1, 6);
      const todos = Array.from({ length: 6 }, (_, i) => (n + i) ** 2);
      return {
        todos,
        regla: `Son los cuadrados de ${n}, ${n + 1}, ${n + 2}…: ${todos.slice(0, 3).join(", ")}…, y sigue ${n + 5}² = ${todos[5]}`,
        dificultad: 1,
        pistas: [todos[4] + (todos[4] - todos[3]), todos[5] + 2, todos[5] - 2],
        intermedio: true,
      };
    }
    case "cuadrados-mas": {
      const n = int(1, 5);
      const c = pick([1, 2, 3, 5]);
      const todos = Array.from({ length: 6 }, (_, i) => (n + i) ** 2 + c);
      return {
        todos,
        regla: `Cada término es un cuadrado más ${c}: ${n}² + ${c} = ${todos[0]}, ${n + 1}² + ${c} = ${todos[1]}… y sigue ${n + 5}² + ${c} = ${todos[5]}`,
        dificultad: 3,
        pistas: [todos[4] + (todos[4] - todos[3]), todos[5] - c, todos[5] + c],
      };
    }
    case "cubos": {
      const n = int(1, 3);
      const todos = Array.from({ length: 5 }, (_, i) => (n + i) ** 3);
      return {
        todos,
        regla: `Son los cubos de ${n}, ${n + 1}, ${n + 2}…: ${todos.slice(0, 3).join(", ")}…, y sigue ${n + 4}³ = ${todos[4]}`,
        dificultad: 2,
        pistas: [todos[3] + (todos[3] - todos[2]), todos[4] + 10, todos[4] - 10],
      };
    }
    case "mixta": {
      const x0 = int(1, 4);
      const suma = int(2, 5);
      const por = pick([2, 3]);
      const todos = [x0];
      for (let i = 0; i < 6; i++) todos.push(i % 2 === 0 ? todos[i] + suma : todos[i] * por);
      return {
        todos,
        regla: `Se alternan dos operaciones: sumar ${suma} y multiplicar por ${por}. ${todos[0]} +${suma} = ${todos[1]}, ×${por} = ${todos[2]}, +${suma} = ${todos[3]}…`,
        dificultad: 3,
        pistas: [todos[5] + suma, todos[5] * por, todos[5] + suma + 1],
      };
    }
    case "fibonacci": {
      const u0 = int(1, 4);
      const u1 = u0 + int(1, 3);
      const todos = [u0, u1];
      for (let i = 2; i < 8; i++) todos.push(todos[i - 1] + todos[i - 2]);
      return {
        todos,
        regla: `Cada término es la suma de los dos anteriores: ${todos[0]} + ${todos[1]} = ${todos[2]}, ${todos[1]} + ${todos[2]} = ${todos[3]}…`,
        dificultad: 3,
        pistas: [todos[6] + (todos[6] - todos[5]), todos[6] * 2, todos[6] + todos[5] + 1],
      };
    }
    case "primos": {
      const primos = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
      const i0 = pick([0, 0, 1, 2, 3]);
      const todos = primos.slice(i0, i0 + 7);
      const sig = todos[6];
      return {
        todos,
        regla: `Son números primos consecutivos: ${todos.slice(0, 6).join(", ")}…; el siguiente primo es ${sig}`,
        dificultad: 1,
        pistas: [sig + 2, sig - 2, sig + 1],
      };
    }
    default: {
      // factoriales
      const ini = pick([1, 2]);
      const f = [1, 1, 2, 6, 24, 120, 720, 5040];
      const todos = f.slice(ini, ini + 6);
      return {
        todos,
        regla: `Cada término es el anterior multiplicado por ${ini + 1}, ${ini + 2}, ${ini + 3}… (son factoriales): el siguiente es ×${ini + 5}, es decir, ${todos[5]}`,
        dificultad: 3,
        pistas: [todos[4] + (todos[4] - todos[3]), todos[4] * 4, todos[5] + 100],
      };
    }
  }
}

export function seriesNumericas(a: Azar, familia: string): Borrador {
  const s = serie(a, familia);
  const largo = s.todos.length - 1;
  const usarHueco = s.intermedio && a.rnd() < 0.35;
  if (usarHueco) {
    const hueco = a.int(1, largo - 2);
    const respuesta = s.todos[hueco];
    const visibles = s.todos.slice(0, largo).map((t, i) => (i === hueco ? "?" : String(t)));
    const otras = distractoresNumericos(respuesta, [respuesta + 1, respuesta - 1, respuesta + 2], { minimo: 0 });
    return {
      tipo: "serie-num",
      tema: TEMA,
      articulo: "Series numéricas",
      enunciado: `¿Qué número falta en la serie ${visibles.join(", ")}?`,
      correcta: cifra(respuesta),
      otras: otras.map(cifra),
      explicacion: `${s.regla}. El término que falta es ${respuesta}.`,
      dificultad: s.dificultad,
    };
  }
  const siguiente = s.todos[largo];
  const otras = distractoresNumericos(siguiente, s.pistas, { minimo: 0 });
  return {
    tipo: "serie-num",
    tema: TEMA,
    articulo: "Series numéricas",
    enunciado: `¿Qué número continúa la serie ${s.todos.slice(0, largo).join(", ")}, …?`,
    correcta: cifra(siguiente),
    otras: otras.map(cifra),
    explicacion: `${s.regla}. El siguiente término es ${siguiente}.`,
    dificultad: s.dificultad,
  };
}

export const FAMILIAS_SERIES = [
  "aritmetica",
  "decreciente",
  "geometrica",
  "geometrica-decreciente",
  "alterna",
  "diferencias",
  "cuadrados",
  "cuadrados-mas",
  "cubos",
  "mixta",
  "fibonacci",
  "primos",
  "factoriales",
];

// ———————— Cálculo ————————

export function porcentaje(a: Azar): Borrador {
  const { int, pick } = a;
  const pct = pick([5, 10, 12, 15, 20, 25, 30, 35, 40, 60, 75]);
  const paso = 100 / gcd(pct, 100);
  const base = paso * int(Math.ceil(40 / paso), Math.ceil(400 / paso));
  const r = (base * pct) / 100;
  const otras = distractoresNumericos(r, [base - r, r * 10, (base * (pct + 5)) / 100], { minimo: 0 });
  return {
    tipo: "porcentaje",
    tema: TEMA,
    articulo: "Porcentajes",
    enunciado: `¿Cuál es el ${pct} % de ${cifra(base)}?`,
    correcta: cifra(r),
    otras: otras.map(cifra),
    explicacion: `El ${pct} % de ${cifra(base)} es ${cifra(base)} × ${pct} ÷ 100 = ${cifra(r)}.`,
    dificultad: pct % 5 === 0 && pct <= 50 ? 1 : 2,
  };
}

export function rebajaOAumento(a: Azar): Borrador {
  const { int, pick } = a;
  const sube = a.rnd() < 0.45;
  const pct = pick([5, 10, 15, 20, 25, 30, 40, 50]);
  const paso = 100 / gcd(pct, 100);
  const base = paso * int(Math.ceil(40 / paso), Math.ceil(300 / paso));
  const cambio = (base * pct) / 100;
  const final = sube ? base + cambio : base - cambio;
  const cosas = [
    ["un artículo de papelería", "cuesta"],
    ["un ordenador", "cuesta"],
    ["una silla de oficina", "cuesta"],
    ["un curso de formación", "cuesta"],
  ] as const;
  const [cosa, verbo] = pick(cosas);
  const otras = distractoresNumericos(final, [sube ? base - cambio : base + cambio, cambio, base + pct], { minimo: 0 });
  return {
    tipo: "rebaja",
    tema: TEMA,
    articulo: "Porcentajes",
    enunciado: `${cosa.charAt(0).toUpperCase() + cosa.slice(1)} ${verbo} ${euros(base)} y su precio ${sube ? "sube" : "baja"} un ${pct} %. ¿Cuál es el precio final?`,
    correcta: euros(final),
    otras: otras.map(euros),
    explicacion: `El ${pct} % de ${euros(base)} son ${euros(cambio)}. El precio final es ${euros(base)} ${sube ? "+" : "−"} ${euros(cambio)} = ${euros(final)}.`,
    dificultad: [10, 20, 25, 50].includes(pct) ? 1 : 2,
  };
}

export function reglaDeTres(a: Azar): Borrador {
  const { int, pick } = a;
  if (a.rnd() < 0.6) {
    const unidad = pick([0.25, 0.5, 0.75, 1.25, 1.5, 2, 2.5, 3]);
    const n = int(3, 9);
    const m = int(10, 24);
    const coste = n * unidad;
    const r = m * unidad;
    const cosas = pick(["sobres", "bolígrafos", "carpetas", "sellos", "cuadernos"]);
    const otras = distractoresNumericos(r, [r + unidad, r - unidad, r + 2 * unidad], { entero: false, minimo: 0 });
    return {
      tipo: "regla3",
      tema: TEMA,
      articulo: "Regla de tres",
      enunciado: `Si ${n} ${cosas} cuestan ${euros(coste)}, ¿cuánto cuestan ${m}?`,
      correcta: euros(r),
      otras: otras.map(euros),
      explicacion: `Un ${cosas.slice(0, -1)} cuesta ${euros(coste)} ÷ ${n} = ${euros(unidad)}. Entonces ${m} cuestan ${m} × ${euros(unidad)} = ${euros(r)}.`,
      dificultad: 1,
    };
  }
  // Proporcionalidad inversa: más personas, menos días.
  for (;;) {
    const w1 = int(2, 9);
    const dias = int(4, 20);
    const w2 = int(2, 12);
    if (w1 === w2 || (w1 * dias) % w2 !== 0) continue;
    const r = (w1 * dias) / w2;
    if (r < 1 || r > 60) continue;
    const otras = distractoresNumericos(r, [(dias * w2) / w1, dias + (w2 - w1), dias - (w2 - w1)], { minimo: 1 });
    return {
      tipo: "regla3",
      tema: TEMA,
      articulo: "Regla de tres",
      enunciado: `Si ${w1} empleados, trabajando al mismo ritmo, tardan ${dias} días en clasificar unos expedientes, ¿cuántos días tardarán ${w2} empleados?`,
      correcta: cifra(r),
      otras: otras.map(cifra),
      explicacion: `Es proporcionalidad inversa: más empleados, menos días. El trabajo total es ${w1} × ${dias} = ${w1 * dias} jornadas, y repartido entre ${w2} empleados salen ${w1 * dias} ÷ ${w2} = ${r} días.`,
      dificultad: 2,
    };
  }
}

export function fracciones(a: Azar): Borrador {
  const { int, pick } = a;
  const modo = pick(["de", "de", "quedan", "que-fraccion"]);
  const den = pick([3, 4, 5, 6, 8, 10]);
  const num = int(1, den - 1);
  const base = den * int(Math.ceil(30 / den), Math.ceil(240 / den));
  if (modo === "que-fraccion") {
    const parte = (base / den) * num;
    const simple = gcd(num, den);
    const fn = num / simple;
    const fd = den / simple;
    const correcta = `${fn}/${fd}`;
    const cand = [`${fd - fn === 0 ? fn + 1 : fd - fn}/${fd}`, `${fn}/${fd + 1}`, `${fn + 1}/${fd + 1}`, `${fn + 1}/${fd}`, `${fd}/${fn + 1}`];
    const otras = [...new Set(cand.filter((c) => c !== correcta))].slice(0, 3);
    return {
      tipo: "fraccion",
      tema: TEMA,
      articulo: "Fracciones",
      enunciado: `¿Qué fracción de ${base} es ${parte}? Da la fracción simplificada.`,
      correcta,
      otras,
      explicacion: `${parte}/${base} se simplifica dividiendo numerador y denominador entre ${gcd(parte, base)}: da ${correcta}.`,
      dificultad: 3,
    };
  }
  if (modo === "quedan") {
    const hecho = (base / den) * num;
    const quedan = base - hecho;
    const otras = distractoresNumericos(quedan, [hecho, base / den, quedan + base / den], { minimo: 0 });
    return {
      tipo: "fraccion",
      tema: TEMA,
      articulo: "Fracciones",
      enunciado: `Un archivo tiene ${base} expedientes y ya se han revisado ${num}/${den}. ¿Cuántos faltan por revisar?`,
      correcta: cifra(quedan),
      otras: otras.map(cifra),
      explicacion: `${num}/${den} de ${base} son ${hecho} expedientes revisados. Faltan ${base} − ${hecho} = ${quedan}.`,
      dificultad: 1,
    };
  }
  const r = (base / den) * num;
  const otras = distractoresNumericos(r, [base / den, base - r, (base / den) * (num + 1)], { minimo: 0 });
  return {
    tipo: "fraccion",
    tema: TEMA,
    articulo: "Fracciones",
    enunciado: `¿Cuánto son ${num}/${den} de ${base}?`,
    correcta: cifra(r),
    otras: otras.map(cifra),
    explicacion: `Se divide entre ${den} y se multiplica por ${num}: ${base} ÷ ${den} = ${base / den}, y ${base / den} × ${num} = ${r}.`,
    dificultad: 1,
  };
}

export function operacionesCombinadas(a: Azar): Borrador {
  const { int, pick } = a;
  for (;;) {
    const forma = pick(["(a+b)*c-d", "a+b*c-d", "a*b+c*d", "a-b*c+d", "(a-b)*c+d", "a*(b+c)-d"]);
    const v = Array.from({ length: 4 }, () => int(2, 12));
    const [x, y, z, w] = v;
    let texto = "";
    let r = 0;
    let izquierda = 0; // resultado si se operara de izquierda a derecha sin respetar la jerarquía
    switch (forma) {
      case "(a+b)*c-d":
        texto = `(${x} + ${y}) × ${z} − ${w}`;
        r = (x + y) * z - w;
        izquierda = x + y * z - w;
        break;
      case "a+b*c-d":
        texto = `${x} + ${y} × ${z} − ${w}`;
        r = x + y * z - w;
        izquierda = (x + y) * z - w;
        break;
      case "a*b+c*d":
        texto = `${x} × ${y} + ${z} × ${w}`;
        r = x * y + z * w;
        izquierda = ((x * y + z) * w);
        break;
      case "a-b*c+d":
        texto = `${x} − ${y} × ${z} + ${w}`;
        r = x - y * z + w;
        izquierda = (x - y) * z + w;
        break;
      case "(a-b)*c+d":
        texto = `(${x} − ${y}) × ${z} + ${w}`;
        r = (x - y) * z + w;
        izquierda = x - y * z + w;
        break;
      default:
        texto = `${x} × (${y} + ${z}) − ${w}`;
        r = x * (y + z) - w;
        izquierda = x * y + z - w;
    }
    if (r <= 0 || r === izquierda) continue;
    const otras = distractoresNumericos(r, [izquierda, r + w, r - w], { minimo: 0 });
    return {
      tipo: "combinada",
      tema: TEMA,
      articulo: "Operaciones combinadas",
      enunciado: `¿Cuál es el resultado de ${texto}?`,
      correcta: cifra(r),
      otras: otras.map(cifra),
      explicacion: `Primero los paréntesis y las multiplicaciones, y después las sumas y restas. El resultado es ${r}.`,
      dificultad: 2,
    };
  }
}

export function media(a: Azar): Borrador {
  const { int } = a;
  if (a.rnd() < 0.5) {
    const n = int(4, 5);
    const m = int(6, 20);
    const nums = Array.from({ length: n }, () => m + int(-4, 6));
    const suma = nums.reduce((s, x) => s + x, 0);
    const resto = suma % n;
    if (resto !== 0) nums[0] += n - resto;
    const total = nums.reduce((s, x) => s + x, 0);
    const promedio = total / n;
    const otras = distractoresNumericos(promedio, [promedio + 1, promedio - 1, Math.max(...nums)], { minimo: 0 });
    return {
      tipo: "media",
      tema: TEMA,
      articulo: "Medias",
      enunciado: `¿Cuál es la media de ${nums.slice(0, -1).join(", ")} y ${nums[n - 1]}?`,
      correcta: cifra(promedio),
      otras: otras.map(cifra),
      explicacion: `La suma es ${nums.join(" + ")} = ${total}, y ${total} ÷ ${n} = ${promedio}.`,
      dificultad: 1,
    };
  }
  const n = int(4, 6);
  const promedio = int(8, 30);
  const total = n * promedio;
  const conocidos = Array.from({ length: n - 1 }, (_, i) => promedio + (i % 2 === 0 ? int(1, 5) : -int(1, 5)));
  const suma = conocidos.reduce((s, x) => s + x, 0);
  const falta = total - suma;
  if (falta <= 0) return media(a);
  const otras = distractoresNumericos(falta, [promedio, total - suma + n, falta + 2], { minimo: 0 });
  return {
    tipo: "media",
    tema: TEMA,
    articulo: "Medias",
    enunciado: `La media de ${n} números es ${promedio}. Si ${n - 1} de ellos son ${conocidos.join(", ")}, ¿cuál es el número que falta?`,
    correcta: cifra(falta),
    otras: otras.map(cifra),
    explicacion: `Los ${n} números suman ${n} × ${promedio} = ${total}. Los conocidos suman ${suma}, así que falta ${total} − ${suma} = ${falta}.`,
    dificultad: 3,
  };
}

export function reparto(a: Azar): Borrador {
  const { int, pick } = a;
  const partes = pick([[2, 3], [1, 2, 3], [2, 3, 5], [3, 4], [1, 4], [2, 3, 4]]);
  const suma = partes.reduce((s, x) => s + x, 0);
  const unidad = int(10, 60);
  const total = suma * unidad;
  const mayor = Math.max(...partes) * unidad;
  const menor = Math.min(...partes) * unidad;
  const pideMayor = a.rnd() < 0.6;
  const r = pideMayor ? mayor : menor;
  const otras = distractoresNumericos(r, [total / partes.length, pideMayor ? menor : mayor, r + unidad], { minimo: 0 });
  return {
    tipo: "reparto",
    tema: TEMA,
    articulo: "Reparto proporcional",
    enunciado: `Se reparten ${euros(total)} entre ${partes.length} personas en partes proporcionales a ${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}. ¿Cuánto recibe la que ${pideMayor ? "más" : "menos"} recibe?`,
    correcta: euros(r),
    otras: otras.map(euros),
    explicacion: `En total hay ${partes.join(" + ")} = ${suma} partes, y cada una vale ${euros(total)} ÷ ${suma} = ${euros(unidad)}. La que ${pideMayor ? "más" : "menos"} recibe tiene ${pideMayor ? Math.max(...partes) : Math.min(...partes)} partes: ${euros(r)}.`,
    dificultad: 3,
  };
}

function gcd(x: number, y: number): number {
  return y === 0 ? x : gcd(y, x % y);
}
