import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

/** La web se instala como una app: icono de Clara, pantalla completa y entrada directa a «Hoy». */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITIO.nombre,
    short_name: "Op. Claras",
    description: "Test del Auxiliar, el Administrativo y Agente de Hacienda con la explicación de cada respuesta.",
    lang: "es",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f9f6",
    theme_color: "#f7f9f6",
    categories: ["education"],
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Reto relámpago", url: "/reto", icons: [{ src: "/iconos/icono-192.png", sizes: "192x192" }] },
      { name: "Tu racha", url: "/app/racha", icons: [{ src: "/iconos/icono-192.png", sizes: "192x192" }] },
    ],
  };
}
