// Nombre y lema: se cambian aquí y se propagan a toda la web.
export const SITIO = {
  nombre: "Oposiciones Claras",
  lema: "Test de oposiciones con cada respuesta explicada",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  descripcion:
    "Test para preparar el Auxiliar Administrativo del Estado con la explicación de cada respuesta y el artículo exacto de la ley.",
  avisoNoOficial:
    "No somos una plataforma oficial ni estamos vinculados al INAP ni a ningún organismo público.",
} as const;

// Precios mostrados en la web. Los importes reales los cobra Stripe
// (STRIPE_PRICE_MENSUAL y STRIPE_PRICE_ANUAL); estos solo se muestran en la web.
export const PRECIOS = {
  mensual: 9.99,
  anual: 69.99,
} as const;

export const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

/** Oposición activa mientras solo haya una. */
export const OPOSICION = "aux-age";

// PENDIENTE: datos del titular para el aviso legal y la política de privacidad.
export const TITULAR = {
  nombre: "[Nombre o razón social]",
  nif: "[NIF]",
  domicilio: "[Domicilio]",
  email: "[correo de contacto]",
  registro: "[Datos registrales, si es una sociedad]",
} as const;
