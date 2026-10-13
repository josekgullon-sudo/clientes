import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Tarjeta cuadrada para compartir (WhatsApp, Instagram): la racha o el resultado del reto, con Clara.
 *   /api/tarjeta?tipo=racha&n=12
 *   /api/tarjeta?tipo=reto&n=18
 */
const TIPOS = {
  racha: { fondo: "#c2410c", sombra: "#9a3412", circulo: "#ffedd5", linea1: (n: number) => (n === 1 ? "día de racha" : "días de racha"), linea2: "Estudiando cada día" },
  reto: { fondo: "#15803d", sombra: "#0f5f2d", circulo: "#dcfce7", linea1: (n: number) => (n === 1 ? "acierto en 60 s" : "aciertos en 60 s"), linea2: "Reto relámpago · ¿Me superas?" },
} as const;

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const tipo = q.get("tipo") === "reto" ? "reto" : "racha";
  const n = Math.max(0, Math.min(9999, Math.floor(Number(q.get("n")) || 0)));
  const t = TIPOS[tipo];

  const [fuente, clara] = await Promise.all([
    readFile(join(process.cwd(), "src/app/api/tarjeta/nunito-black.ttf")),
    readFile(join(process.cwd(), "public/compartir/clara-celebra.png")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: t.fondo,
          padding: "64px 56px 56px",
          fontFamily: "Nunito",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 44 }}>
          <span
            style={{ display: "flex", width: 22, height: 22, borderRadius: 11, background: "#facc15" }}
          />
          Oposiciones Claras
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 440, height: 440, borderRadius: 220, background: t.circulo }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen dentro de la tarjeta generada */}
            <img src={`data:image/png;base64,${clara.toString("base64")}`} width={320} height={400} alt="" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: 260, lineHeight: 1, color: "#fde047" }}>{n}</span>
            <span style={{ fontSize: 64, lineHeight: 1.1, maxWidth: 420 }}>{t.linea1(n)}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            background: "#ffffff",
            color: t.fondo,
            fontSize: 46,
            padding: "22px 40px",
            borderRadius: 32,
            boxShadow: `0 10px 0 ${t.sombra}`,
          }}
        >
          {t.linea2}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: [{ name: "Nunito", data: fuente, weight: 900, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=86400, immutable" },
    },
  );
}
