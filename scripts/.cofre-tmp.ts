import { chromium } from "playwright";
const EMAIL = "recorrido1791912858847@ejemplo.es";
const M = "http://127.0.0.1:54324";
async function codigo() {
  for (let i = 0; i < 40; i++) {
    const r = await (await fetch(`${M}/api/v1/search?query=to:${EMAIL}`)).json();
    if (r.messages?.length) {
      const m = await (await fetch(`${M}/api/v1/message/${r.messages[0].ID}`)).json();
      const c = String(m.Text).match(/\b(\d{6})\b/)?.[1];
      if (c) return c;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("sin código");
}
(async () => {
  await fetch(`${M}/api/v1/messages`, { method: "DELETE" });
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await (await b.newContext({ viewport: { width: 380, height: 800 }, deviceScaleFactor: 2, colorScheme: (process.argv[2] ?? "light") as "light" })).newPage();
  await p.goto("http://localhost:3000/entrar");
  await p.fill("#email", EMAIL);
  await p.getByRole("button", { name: /Enviarme el código/ }).click();
  await p.locator("#codigo").waitFor();
  await p.fill("#codigo", await codigo());
  await p.getByRole("button", { name: /Entrar con el código/ }).click();
  await p.waitForURL(/\/app/);
  await p.waitForLoadState("networkidle");
  const abrir = p.getByRole("button", { name: /^Abrir$/ });
  if (await abrir.isVisible()) {
    await abrir.click();
    await p.getByRole("dialog").waitFor();
    await p.waitForTimeout(900);
    await p.screenshot({ path: "/tmp/claude-0/-home-user-clientes/1bcccf04-047a-5d03-8d72-9074f088053a/scratchpad/cofre-abierto.png" });
    await p.getByRole("button", { name: /Genial/ }).click();
  }
  for (const r of process.argv.slice(3)) {
    await p.goto("http://localhost:3000" + r, { waitUntil: "networkidle" });
    await p.screenshot({ path: "/tmp/claude-0/-home-user-clientes/1bcccf04-047a-5d03-8d72-9074f088053a/scratchpad/" + r.replaceAll("/", "_") + "-" + (process.argv[2] ?? "light") + ".png", fullPage: true });
  }
  await b.close();
})();
