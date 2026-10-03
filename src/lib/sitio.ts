// Nombre provisional: se cambia aquí y se propaga a toda la web.
export const SITIO = {
  nombre: "Subrayado",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  descripcion:
    "Test para preparar el Auxiliar Administrativo del Estado con la explicación de cada respuesta y el artículo exacto de la ley.",
  avisoNoOficial:
    "No somos una plataforma oficial ni estamos vinculados al INAP ni a ningún organismo público.",
} as const;
