/**
 * Capturas a 380 px (claro y oscuro) para revisar cada pantalla en móvil.
 * Con el servidor de desarrollo arrancado:
 *
 *   npm run capturas                 # rutas por defecto
 *   npm run capturas -- /demo /      # rutas concretas
 *
 * Guarda los PNG en /capturas (ignorada por git).
 */
import { mkdirSync } from "node:fs";
import { chromium, type Page } from "playwright";

const BASE = process.env.CAPTURAS_URL ?? "http://localhost:3000";
const rutas = process.argv.slice(2).filter((a) => a.startsWith("/"));
const RUTAS = rutas.length ? rutas : ["/", "/demo"];

/** Pasos extra para pantallas con interacción. */
const flujos: Record<string, (p: Page, foto: (n: string) => Promise<void>) => Promise<void>> = {
  "/demo": async (p, foto) => {
    await p.getByText("A", { exact: true }).first().click();
    await foto("elegida");
    await p.getByRole("button", { name: /Comprobar/ }).click();
    await foto("comprobada");
    for (let i = 1; i < 60; i++) {
      const fin = p.getByRole("button", { name: /Ver resultado/ });
      if (await fin.isVisible()) {
        await fin.click();
        break;
      }
      await p.getByRole("button", { name: /Siguiente/ }).click();
      await p.locator("label").nth(i % 4).click();
      await p.getByRole("button", { name: /Comprobar/ }).click();
    }
    await p.getByRole("heading", { name: /aciertos/ }).waitFor();
    await foto("resumen");
  },
};

async function main() {
  mkdirSync("capturas", { recursive: true });
  const navegador = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? undefined,
  });
  for (const tema of ["light", "dark"] as const) {
    const ctx = await navegador.newContext({
      viewport: { width: 380, height: 800 },
      deviceScaleFactor: 2,
      colorScheme: tema,
      reducedMotion: "reduce",
    });
    for (const ruta of RUTAS) {
      const p = await ctx.newPage();
      const nombre = (ruta === "/" ? "inicio" : ruta.slice(1).replaceAll("/", "_")) + `-${tema}`;
      const foto = async (paso: string, completa = false) => {
        await p.screenshot({ path: `capturas/${nombre}-${paso}.png`, fullPage: completa });
      };
      await p.goto(BASE + ruta, { waitUntil: "networkidle" });
      await foto("inicial");
      await foto("completa", true);
      // Sin scroll horizontal a 380 px.
      const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
      if (ancho > 380) console.log(`AVISO ${ruta} (${tema}): scroll horizontal, ancho ${ancho}px`);
      await flujos[ruta]?.(p, foto);
      await p.close();
    }
    await ctx.close();
  }
  await navegador.close();
  console.log("Capturas en ./capturas");
}

main();
