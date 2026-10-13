import type { Metadata, Viewport } from "next";
import { Figtree, Nunito, Source_Serif_4 } from "next/font/google";
import { Analitica } from "@/components/analitica";
import { AvisoCookies } from "@/components/aviso-cookies";
import { SITIO } from "@/lib/sitio";
import "./globals.css";

// Figtree: muy legible y con cifras limpias (el cero sin tachar) para contadores y botones.
const interfaz = Figtree({
  variable: "--fuente-interfaz",
  subsets: ["latin"],
  display: "swap",
});

// Nunito: titulares redondeados y cercanos.
const titulos = Nunito({
  variable: "--fuente-titulos",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

// Source Serif 4: solo para el texto literal de la ley, que así se distingue del resto.
const lectura = Source_Serif_4({
  variable: "--fuente-lectura",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITIO.url),
  title: {
    default: `${SITIO.nombre} · ${SITIO.lema}`,
    template: `%s · ${SITIO.nombre}`,
  },
  description: SITIO.descripcion,
  applicationName: SITIO.nombre,
  appleWebApp: { capable: true, title: "Op. Claras", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1513" },
  ],
};

// Aplica el tema guardado antes de pintar para evitar el parpadeo.
const scriptTema = `try{var t=localStorage.getItem("tema");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${interfaz.variable} ${titulos.variable} ${lectura.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <Analitica />
        <AvisoCookies />
      </body>
    </html>
  );
}
