// Nombre provisional: se cambia aquí y se propaga a toda la web.
export const SITIO = {
  nombre: "Subrayado",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  descripcion:
    "Test para preparar el Auxiliar Administrativo del Estado con la explicación de cada respuesta y el artículo exacto de la ley.",
  avisoNoOficial:
    "No somos una plataforma oficial ni estamos vinculados al INAP ni a ningún organismo público.",
} as const;

// PROVISIONAL: precios pendientes de decidir. Los importes reales los cobra Stripe
// (STRIPE_PRICE_MENSUAL y STRIPE_PRICE_ANUAL); estos solo se muestran en la web.
export const PRECIOS = {
  mensual: 12.99,
  anual: 89.99,
} as const;

export const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

/** Oposición activa mientras solo haya una. */
export const OPOSICION = "aux-age";
