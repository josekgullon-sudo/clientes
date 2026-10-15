/**
 * Recorrido completo por la web a 380 px (y la home y el área privada también a 1280 px), con y sin sesión.
 * Necesita `npm run dev` y Supabase local con preguntas importadas.
 *
 *   npm run recorrido              # claro
 *   npm run recorrido -- dark      # oscuro
 *
 * Guarda las capturas en /capturas/recorrido (ignorada por git) y avisa si alguna
 * pantalla tiene scroll horizontal.
 */
import { mkdirSync } from "node:fs";
import { chromium, type Page } from "playwright";

const BASE = process.env.CAPTURAS_URL ?? "http://localhost:3000";
const MAILPIT = "http://127.0.0.1:54324";
const tema = process.argv.includes("dark") ? "dark" : "light";
// Con «admin» o «agente», el recorrido elige esa oposición en el onboarding.
const OPOSICION_RECORRIDO = process.argv.includes("agente")
  ? /^Agente de la Hacienda/
  : process.argv.includes("admin")
    ? /^Administrativo del Estado/
    : /^Auxiliar Administrativo/;
const DIR = `capturas/recorrido`;
const EMAIL = `recorrido${Date.now()}@ejemplo.es`;
let n = 0;

async function foto(p: Page, nombre: string, completa = true) {
  n++;
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
  const vista = p.viewportSize()?.width ?? 0;
  if (ancho > vista) console.log(`AVISO ${nombre}: scroll horizontal (${ancho}px)`);
  await p.screenshot({ path: `${DIR}/${String(n).padStart(2, "0")}-${nombre}-${tema}.png`, fullPage: completa });
}

async function codigo(): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const r = await (await fetch(`${MAILPIT}/api/v1/search?query=to:${EMAIL}`)).json();
    if (r.messages?.length) {
      const m = await (await fetch(`${MAILPIT}/api/v1/message/${r.messages[0].ID}`)).json();
      const c = String(m.Text).match(/\b(\d{6,10})\b/)?.[1];
      if (c) return c;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("No ha llegado el correo con el código");
}

/** Responde todas las preguntas de un test de estudio hasta el resultado. */
async function responderEstudio(p: Page, primeraFoto: string) {
  for (let i = 0; i < 40; i++) {
    const opciones = p.locator("main fieldset label");
    await opciones.first().waitFor();
    await opciones.nth(i % 4).click();
    if (i === 0) await foto(p, `${primeraFoto}-elegida`, false);
    await p.getByRole("button", { name: /Comprobar/ }).click();
    if (i === 0) await foto(p, `${primeraFoto}-corregida`, false);
    const fin = p.getByRole("button", { name: /Ver resultado|Terminar/ });
    if (await fin.isVisible()) {
      await fin.click();
      return;
    }
    await p.getByRole("button", { name: /Siguiente|Continuar/ }).click();
  }
}

async function main() {
  mkdirSync(DIR, { recursive: true });
  const navegador = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? undefined });

  // Escritorio: solo la home.
  const escritorio = await navegador.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: tema });
  const pe = await escritorio.newPage();
  await pe.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await foto(pe, "home-escritorio");
  await escritorio.close();

  const ctx = await navegador.newContext({
    viewport: { width: 380, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: tema,
    reducedMotion: "reduce",
  });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log("ERROR EN PÁGINA:", e.message));

  for (const [ruta, nombre] of [
    ["/", "home"],
    ["/test/constitucion", "seo-ley"],
    ["/reto", "reto"],
    ["/legal/condiciones", "legal"],
  ]) {
    await p.goto(BASE + ruta, { waitUntil: "networkidle" });
    await foto(p, nombre);
  }
  // El aviso de cookies tapa partes de la pantalla en las capturas siguientes.
  await p.evaluate(() => localStorage.setItem("consentimiento-cookies", "no"));

  await p.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
  await foto(p, "demo-inicio", false);
  await responderEstudio(p, "demo");
  await p.locator("#titulo-resumen").waitFor();
  await p.waitForTimeout(400);
  await foto(p, "demo-resultado");

  await p.goto(`${BASE}/entrar?registro=1`, { waitUntil: "networkidle" });
  await foto(p, "registro");
  await p.fill("#email", EMAIL);
  await p.getByRole("button", { name: /Enviarme el código/ }).click();
  await p.locator("#codigo").waitFor();
  await foto(p, "registro-codigo");
  await p.fill("#codigo", await codigo());
  await p.getByRole("button", { name: /Entrar con el código/ }).click();
  await p.waitForURL(/\/app/);
  // Tras /app llega la redirección al onboarding en la cuenta nueva.
  await p.waitForTimeout(2500);
  await p.waitForLoadState("networkidle");

  if (p.url().includes("onboarding")) {
    await foto(p, "onboarding-0");
    await p.getByRole("radio", { name: OPOSICION_RECORRIDO }).click();
    await p.getByRole("button", { name: /Seguir/ }).click();
    await foto(p, "onboarding-1");
    await p.getByRole("button", { name: /Aún no lo sé/ }).click();
    await p.getByRole("button", { name: /Seguir/ }).click();
    await foto(p, "onboarding-2");
    await p.getByRole("button", { name: /Seguir/ }).click();
    await foto(p, "onboarding-3");
    await p.getByRole("button", { name: /Ahora no/ }).click();
    await p.waitForURL((u) => u.pathname === "/app");
  }
  await p.waitForLoadState("networkidle");
  await foto(p, "panel");

  const continuar = p.getByRole("button", { name: /^Empezar ·|^Empezar lección|^Hacer 10/ }).first();
  if (await continuar.isVisible()) {
    await continuar.click();
    await p.waitForURL(/\/app\/test\//);
    await responderEstudio(p, "leccion");
    await p.locator("#titulo-resumen").waitFor({ timeout: 20000 }).catch(async (e) => {
      await foto(p, "ERROR-leccion", false);
      throw e;
    });
    await p.waitForTimeout(600);
    await foto(p, "leccion-resultado");
  }

  await p.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await foto(p, "panel-despues");
  const cofre = p.getByRole("button", { name: /^Abrir$/ });
  if (await cofre.isVisible()) {
    await cofre.click();
    await p.getByRole("dialog").waitFor();
    await p.waitForTimeout(700);
    await foto(p, "cofre", false);
    await p.getByRole("button", { name: /Genial/ }).click();
  }

  for (const [ruta, nombre] of [
    ["/app/camino", "camino"],
    ["/app/liga", "liga"],
    ["/app/racha", "racha"],
    ["/app/estadisticas", "progreso"],
    ["/app/simulacro", "simulacro"],
    ["/app/cuenta", "perfil"],
    ["/suscripcion", "planes"],
  ]) {
    await p.goto(BASE + ruta, { waitUntil: "networkidle" });
    await foto(p, nombre);
  }

  // El área privada también en escritorio, con la misma sesión.
  await p.setViewportSize({ width: 1280, height: 860 });
  for (const [ruta, nombre] of [
    ["/app", "panel-escritorio"],
    ["/app/liga", "liga-escritorio"],
    ["/app/racha", "racha-escritorio"],
    ["/app/estadisticas", "progreso-escritorio"],
    ["/app/cuenta", "perfil-escritorio"],
  ]) {
    await p.goto(BASE + ruta, { waitUntil: "networkidle" });
    await foto(p, nombre);
  }

  await navegador.close();
  console.log(`${n} capturas en ${DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
