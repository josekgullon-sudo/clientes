// Nombre y lema: se cambian aquí y se propagan a toda la web.
export const SITIO = {
  nombre: "Oposiciones Claras",
  lema: "Test de oposiciones con cada respuesta explicada",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  descripcion:
    "Test para preparar el Auxiliar, el Administrativo, Agente de Hacienda y Tramitación Procesal con la explicación de cada respuesta y el artículo exacto de la ley. 10 preguntas al día gratis.",
  avisoNoOficial:
    "No somos una plataforma oficial ni estamos vinculados al INAP ni a ningún organismo público.",
} as const;

// Precios mostrados en la web. Stripe cobra 69 € al año y 9,99 € al mes
// (STRIPE_PRICE_MENSUAL y STRIPE_PRICE_ANUAL). Estos importes tienen que coincidir.
export const PRECIOS = {
  mensual: 9.99,
  anual: 69,
} as const;

export const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

/** 69 / 12 = 5,75 €. */
export const precioMesEquivalente = PRECIOS.anual / 12;

/** Preguntas de la sesión gratuita diaria (camino de temas y repaso de fallos). */
export const CUOTA_GRATIS = 10;

/** Oposición por defecto (portada, páginas públicas y cuentas sin elegir). */
export const OPOSICION = "aux-age";

/** Oposiciones que se pueden preparar. Nombre corto para el selector y la barra. */
const TODAS = [
  {
    slug: "aux-age",
    nombre: "Auxiliar Administrativo del Estado",
    corto: "Auxiliar AGE",
    grupo: "C2",
    detalle: "Grupo C2 · título de ESO",
    escala: 50,
    penalizacion: "de un tercio",
    simulacro: "Es el examen completo: las dos partes, con los psicotécnicos y el tiempo del examen real.",
    ritmo: "En el examen tienes unos 49 s (90 min para 110 preguntas).",
    partes: ["Parte 1 · bloque I y psicotécnicos", "Parte 2 · bloque II"],
    notaPrediccion: "",
    bloques: {
      I: { nombre: "Organización pública" },
      II: { nombre: "Actividad administrativa y ofimática" },
      III: { nombre: "Aptitudes administrativas, numéricas y verbales", titulo: "Psicotécnicos" },
    },
  },
  {
    slug: "admin-age",
    nombre: "Administrativo del Estado",
    corto: "Administrativo AGE",
    grupo: "C1",
    detalle: "Grupo C1 · título de Bachiller o Técnico",
    escala: 50,
    penalizacion: "de un tercio",
    simulacro:
      "Es la primera parte del examen: 70 preguntas de todos los bloques. El supuesto práctico no entra; el tiempo es proporcional al examen real.",
    ritmo: "En el examen tienes unos 67 s (100 min para 90 preguntas).",
    partes: ["Primera parte · cuestionario", "Segunda parte"],
    notaPrediccion: " El supuesto práctico no entra en la predicción.",
    bloques: {
      I: { nombre: "Organización del Estado y de la Administración pública" },
      II: { nombre: "Organización de oficinas públicas" },
      III: { nombre: "Derecho administrativo general" },
      IV: { nombre: "Gestión de personal" },
      V: { nombre: "Gestión financiera" },
      VI: { nombre: "Informática básica y ofimática" },
    },
  },
  {
    slug: "agente-aeat",
    nombre: "Agente de la Hacienda Pública",
    corto: "Agente de Hacienda",
    grupo: "C1",
    detalle: "Grupo C1 · Agencia Tributaria",
    escala: 10,
    penalizacion: "de un cuarto",
    simulacro:
      "Es el primer ejercicio: 80 preguntas de todo el programa, con 90 minutos y un cuarto de penalización. Los supuestos prácticos del segundo ejercicio no entran.",
    ritmo: "En el examen tienes unos 68 s (90 min para 80 preguntas).",
    partes: ["Primer ejercicio · cuestionario", "Segundo ejercicio"],
    notaPrediccion: " Los supuestos prácticos del segundo ejercicio no entran en la predicción.",
    bloques: {
      I: { nombre: "Organización del Estado y funcionamiento de la Administración", titulo: "Materias comunes" },
      II: { nombre: "Derecho administrativo general" },
      III: { nombre: "Organización de la Hacienda Pública y Derecho tributario", titulo: "Materias específicas" },
    },
  },
  {
    slug: "tramitacion-procesal",
    nombre: "Tramitación Procesal y Administrativa",
    corto: "Tramitación Procesal",
    grupo: "C1",
    detalle: "Grupo C1 · Administración de Justicia",
    escala: 10,
    penalizacion: "de un cuarto",
    simulacro:
      "Reúne el primer ejercicio (100 preguntas de los temas 1 a 31) y el de Windows y Microsoft 365 (20 preguntas), con un cuarto de penalización. El caso práctico no entra.",
    ritmo: "En el examen tienes unos 70 s (100 min para 100 preguntas) y 2 min por pregunta de ofimática.",
    partes: ["Primer ejercicio · temas 1 a 31", "Tercer ejercicio · ofimática"],
    notaPrediccion: " El caso práctico del segundo ejercicio no entra en la predicción.",
    bloques: {
      I: { nombre: "Constitución, Gobierno y organización del Estado", titulo: "Organización del Estado" },
      II: { nombre: "Administración de Justicia y su personal", titulo: "Administración de Justicia" },
      III: { nombre: "Derecho procesal y Registro Civil", titulo: "Derecho procesal" },
      IV: { nombre: "Informática, Windows y Microsoft 365", titulo: "Ofimática" },
    },
  },
] as const;

/** Pon `false` si hay que ocultar Tramitación Procesal de los selectores (por ejemplo, antes de subir sus preguntas). */
const TRAMITACION_LISTA = true;

export const OPOSICIONES = TODAS.filter((o) => o.slug !== "tramitacion-procesal" || TRAMITACION_LISTA);

type InfoBloque = { nombre: string; titulo?: string };
export type DatosOposicion = (typeof OPOSICIONES)[number] & { bloques: Record<string, InfoBloque> };

export const datosOposicion = (slug: string | null | undefined) =>
  (TODAS.find((o) => o.slug === slug) ?? TODAS[0]) as DatosOposicion;

export type SlugOposicion = (typeof OPOSICIONES)[number]["slug"];

export const esOposicion = (s: unknown): s is SlugOposicion => OPOSICIONES.some((o) => o.slug === s);

/**
 * Titular de la web (datos facilitados por el propietario el 14/10/2026).
 * MONETIX LLC no tiene NIF español: se identifica con su EIN de EE. UU.
 */
export const TITULAR = {
  nombre: "MONETIX LLC",
  nif: "EIN (número fiscal de EE. UU.) 30-1506187",
  domicilio: "412 W 7th St, Clovis, NM 88101, Estados Unidos (domicilio de su agente registrado)",
  email: "hola@oposicionesclaras.com",
  registro:
    "Sociedad de responsabilidad limitada (LLC) constituida el 27 de julio de 2026 en el estado de Nuevo México (Estados Unidos). File number 3275319, Business ID 0008119276.",
} as const;

export const TITULAR_INCOMPLETO = false;
