import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Source_Serif_4 } from "next/font/google";
import { AvisoCookies } from "@/components/aviso-cookies";
import { SITIO } from "@/lib/sitio";
import "./globals.css";

const interfaz = Atkinson_Hyperlegible_Next({
  variable: "--fuente-interfaz",
  subsets: ["latin"],
  display: "swap",
});

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
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#15191b" },
  ],
};

// Aplica el tema guardado antes de pintar para evitar el parpadeo.
const scriptTema = `try{var t=localStorage.getItem("tema");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${interfaz.variable} ${lectura.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <AvisoCookies />
      </body>
    </html>
  );
}
