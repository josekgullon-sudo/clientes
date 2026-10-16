export const TAMANO_LISTA = 40;

export const FILTROS = [
  { id: "todos", texto: "Todos" },
  { id: "sin_test", texto: "Sin test" },
  { id: "limite_sin_pago", texto: "Límite y no compraron" },
  { id: "precios_sin_pago", texto: "Vieron precios y no pagaron" },
  { id: "inactivos_7", texto: "Inactivos 7 días" },
  { id: "premium_riesgo", texto: "Premium en riesgo" },
] as const;

export const ORDENES = [
  { id: "registro", texto: "Más recientes" },
  { id: "ultimo_acceso", texto: "Último acceso" },
  { id: "tests", texto: "Tests" },
  { id: "xp", texto: "XP" },
] as const;

export type FiltroPersona = (typeof FILTROS)[number]["id"];
export type OrdenPersona = (typeof ORDENES)[number]["id"];

export type ConsultaPersonas = {
  filtro: FiltroPersona;
  orden: OrdenPersona;
  busqueda: string;
  pagina: number;
  offset: number;
};

export type FilaPersona = {
  id: string;
  email: string | null;
  registro: string;
  ultimo_acceso: string | null;
  tests: number;
  plan: string | null;
  estado: string | null;
  racha: number;
  xp: number;
  hizo_test: boolean;
  limite: boolean;
  precios: boolean;
  checkout: boolean;
  pago: boolean;
};

export type ListaPersonas = { total: number; filas: FilaPersona[] };

export type PasoEmbudo = { tipo: string; fecha: string };

export type TestFicha = {
  id: string;
  modo: string;
  tema: string | null;
  ley: string | null;
  nota: number | null;
  fecha: string;
  duracion: number | null;
  terminado: boolean;
};

export type ProgresoTema = {
  numero: number;
  titulo: string;
  bloque: string;
  total: number;
  vistas: number;
  dominadas: number;
};

export type FalloFicha = {
  id: string;
  enunciado: string;
  articulo: string;
  ley: string;
  fallos: number;
  respuestas: number;
};

export type EventoFicha = {
  id: number;
  tipo: string;
  meta: Record<string, string>;
  creado_en: string;
};

export type NotaFicha = { id: number | string; texto: string; creado_en: string };

export type SesionFicha = { inicio: string; ultimo_latido: string; segundos: number };

export type SesionesFicha = { total: number; segundos: number; recientes: SesionFicha[] };

export type FichaPersona = {
  usuario: {
    id: string;
    email: string | null;
    registro: string;
    ultimo_acceso: string | null;
    origen: Record<string, string>;
    plan: string | null;
    estado: string | null;
    fin_periodo: string | null;
    stripe_customer_id: string | null;
    racha: number;
    xp: number;
    onboarding: boolean;
  };
  embudo: PasoEmbudo[];
  tests: TestFicha[];
  progreso: ProgresoTema[];
  falladas: FalloFicha[];
  eventos: EventoFicha[];
  notas: { id: string; texto: string; creado_en: string }[];
};

const fechaDia = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Madrid",
});

const fechaHora = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});

function texto(valor: string | string[] | undefined): string {
  return typeof valor === "string" ? valor : "";
}

export function consultaPersonas(q: {
  q?: string | string[];
  filtro?: string | string[];
  orden?: string | string[];
  pagina?: string | string[];
}): ConsultaPersonas {
  const pedido = texto(q.filtro);
  const ordenPedido = texto(q.orden);
  const filtro = FILTROS.some((f) => f.id === pedido) ? (pedido as FiltroPersona) : "todos";
  const orden = ORDENES.some((o) => o.id === ordenPedido) ? (ordenPedido as OrdenPersona) : "registro";
  const pagina = Math.max(1, Number.parseInt(texto(q.pagina), 10) || 1);
  const busqueda = texto(q.q).trim().slice(0, 80);
  return { filtro, orden, busqueda, pagina, offset: (pagina - 1) * TAMANO_LISTA };
}

export function hrefPersonas(base: ConsultaPersonas, cambios: Partial<Pick<ConsultaPersonas, "filtro" | "orden" | "busqueda" | "pagina">> = {}) {
  const c = { ...base, ...cambios };
  const params = new URLSearchParams();
  if (c.busqueda) params.set("q", c.busqueda);
  if (c.filtro !== "todos") params.set("filtro", c.filtro);
  if (c.orden !== "registro") params.set("orden", c.orden);
  if (c.pagina > 1) params.set("pagina", String(c.pagina));
  const s = params.toString();
  return s ? `/admin/usuarios?${s}` : "/admin/usuarios";
}

export function fechaLegible(iso: string | null | undefined, conHora = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return (conHora ? fechaHora : fechaDia).format(d);
}

export function duracionLegible(segundos: number | null | undefined): string {
  if (segundos == null || !Number.isFinite(segundos) || segundos < 0) return "—";
  const s = Math.round(segundos);
  if (s < 60) return `${s} s`;
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  return resto ? `${h} h ${resto} min` : `${h} h`;
}

export function notaLegible(nota: number | null | undefined): string {
  if (nota == null || !Number.isFinite(Number(nota))) return "—";
  return Number(nota).toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

const MODOS: Record<string, string> = {
  tema: "Tema",
  mixto: "Mixto",
  falladas: "Falladas",
  repaso: "Repaso",
  simulacro: "Simulacro",
  leccion: "Lección",
  salto: "Salto",
};

export function modoLegible(modo: string): string {
  return MODOS[modo] ?? modo;
}

export function planLegible(plan: string | null | undefined, estado: string | null | undefined): string {
  if (!plan && !estado) return "Gratis";
  const nombre = plan === "mensual" ? "Mensual" : plan === "anual" ? "Anual" : plan || "Premium";
  const est =
    estado === "active"
      ? "activo"
      : estado === "trialing"
        ? "prueba"
        : estado === "past_due"
          ? "impago"
          : estado === "canceled"
            ? "cancelado"
            : estado || "";
  return est ? `${nombre} · ${est}` : nombre;
}

const CLAVES_ORIGEN = ["utm_source", "utm_medium", "utm_campaign", "gclid", "referrer", "landing"] as const;

const ETIQUETAS_ORIGEN: Record<(typeof CLAVES_ORIGEN)[number], string> = {
  utm_source: "Fuente",
  utm_medium: "Medio",
  utm_campaign: "Campaña",
  gclid: "Google Ads",
  referrer: "Referencia",
  landing: "Entrada",
};

export function origenLegible(origen: Record<string, unknown> | null | undefined): { etiqueta: string; valor: string }[] {
  if (!origen) return [];
  return CLAVES_ORIGEN.flatMap((clave) => {
    const valor = origen[clave];
    if (typeof valor !== "string" || !valor.trim()) return [];
    return [{ etiqueta: ETIQUETAS_ORIGEN[clave], valor: valor.trim() }];
  });
}

export const PASOS_FICHA = [
  { id: "registro", texto: "Registro" },
  { id: "onboarding_fin", texto: "Onboarding" },
  { id: "test_inicio", texto: "Primer test" },
  { id: "limite_gratis", texto: "Límite gratis" },
  { id: "vista_precios", texto: "Vio precios" },
  { id: "checkout_inicio", texto: "Abrió el pago" },
  { id: "pago_ok", texto: "Pagó" },
  { id: "pago_fallido", texto: "Pago fallido" },
  { id: "cancelacion", texto: "Cancelación" },
] as const;

export const ETIQUETAS_EVENTO: Record<string, string> = {
  registro: "Se registró",
  onboarding_fin: "Terminó el onboarding",
  test_inicio: "Empezó un test",
  test_fin: "Terminó un test",
  limite_gratis: "Llegó al límite gratis",
  vista_precios: "Vio los precios",
  checkout_inicio: "Abrió el pago",
  pago_ok: "Pagó",
  pago_fallido: "El pago falló",
  cancelacion: "Canceló",
  email_enviado: "Le escribimos",
};

const META_EVENTO: Record<string, string> = {
  modo: "Modo",
  intento: "Intento",
  motivo: "Motivo",
  plan: "Plan",
  metodo: "Método",
  correo: "Correo",
};

const NOMBRES_CORREO: Record<string, string> = {
  bienvenida: "bienvenida",
  racha: "racha",
  reenganche_3: "reenganche a los 3 días",
  reenganche_7: "reenganche a los 7 días",
  sin_test: "sin test",
  tope: "tope gratis",
  resumen: "resumen semanal",
};

export function metaLegible(meta: Record<string, unknown> | null | undefined): string {
  if (!meta) return "";
  return Object.entries(META_EVENTO)
    .flatMap(([clave, etiqueta]) => {
      const valor = meta[clave];
      if (typeof valor !== "string" || !valor) return [];
      const textoValor =
        clave === "modo"
          ? modoLegible(valor)
          : clave === "plan"
            ? planLegible(valor, null).replace(" · ", "")
            : clave === "correo"
              ? (NOMBRES_CORREO[valor] ?? valor)
              : valor;
      return [`${etiqueta}: ${textoValor}`];
    })
    .join(" · ");
}

export function esUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function paginasDe(total: number): number {
  return Math.max(1, Math.ceil(total / TAMANO_LISTA));
}
