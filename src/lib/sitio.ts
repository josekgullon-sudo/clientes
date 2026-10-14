// Nombre y lema: se cambian aquí y se propagan a toda la web.
export const SITIO = {
  nombre: "Oposiciones Claras",
  lema: "Test de oposiciones con cada respuesta explicada",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  descripcion:
    "Test para preparar el Auxiliar Administrativo del Estado con la explicación de cada respuesta y el artículo exacto de la ley. 10 preguntas al día gratis.",
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

/** Oposición activa mientras solo haya una. */
export const OPOSICION = "aux-age";

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
