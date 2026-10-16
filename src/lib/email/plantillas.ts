import { PRECIOS, SITIO, eur } from "../sitio";
import type { TipoEmail } from "./horario";

export const LOGO_EMAIL = "https://oposicionesclaras.com/iconos/icono-512.png";
export const CLARA_HOLA = "https://oposicionesclaras.com/compartir/clara-hola.png";
export const CLARA_CELEBRA = "https://oposicionesclaras.com/compartir/clara-celebra.png";
const TEAL = "#0EB5A0";

export type DatosCorreo = {
  racha?: number;
  tests?: number | null;
  aciertos?: number | null;
  tema?: string | null;
};

export type Correo = { asunto: string; html: string; texto: string };

function euros(n: number) {
  if (Number.isInteger(n)) return `${n} €`;
  return eur.format(n);
}

export function escaparHtml(valor: string) {
  return valor.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

function boton(href: string, texto: string) {
  const url = escaparHtml(href);
  return `<a href="${url}" style="display:inline-block;background:${TEAL};color:#ffffff;font-family:Poppins,Helvetica,Arial,sans-serif;font-weight:700;font-size:16px;line-height:1;text-decoration:none;padding:16px 28px;border-radius:12px;">${escaparHtml(texto)}</a>`;
}

function marco(clara: string, cuerpo: string, bajaUrl: string) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&amp;display=swap" rel="stylesheet">
<title>${escaparHtml(SITIO.nombre)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;padding:32px 28px;font-family:Poppins,Helvetica,Arial,sans-serif;color:#1a2620;">
<tr><td>
<img src="${LOGO_EMAIL}" width="56" height="56" alt="${escaparHtml(SITIO.nombre)}" style="display:block;border-radius:14px;">
<img src="${clara}" width="96" height="96" alt="Clara" style="display:block;margin-top:20px;">
${cuerpo}
<p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#52615a;">Si no quieres estos avisos, <a href="${escaparHtml(bajaUrl)}" style="color:${TEAL};font-weight:700;">date de baja</a>. Es un clic y no hace falta entrar.</p>
<p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#52615a;">${escaparHtml(SITIO.nombre)} · hola@oposicionesclaras.com</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function parrafo(texto: string) {
  return `<p style="margin:16px 0 0;font-size:16px;line-height:1.5;">${texto}</p>`;
}

export function plantilla(tipo: TipoEmail, datos: DatosCorreo, urls: { origen: string; baja: string }): Correo {
  const diez = `${urls.origen}/app/diez`;
  const precios = `${urls.origen}/suscripcion`;
  const panel = `${urls.origen}/app`;
  const mes = euros(PRECIOS.mensual);
  const ano = euros(PRECIOS.anual);
  const racha = datos.racha ?? 0;
  const tests = datos.tests ?? 0;
  const aciertos = datos.aciertos ?? 0;
  const tema = datos.tema?.trim() || "";

  if (tipo === "bienvenida") {
    const texto = `Ya tienes la cuenta. Empieza por 10 preguntas: cada respuesta lleva el artículo.\n\n${diez}\n\nDate de baja: ${urls.baja}`;
    return {
      asunto: "Tu primer test te espera",
      texto,
      html: marco(
        CLARA_HOLA,
        `${parrafo("Ya tienes la cuenta.")}${parrafo("Empieza por 10 preguntas. Cada respuesta lleva el artículo de la ley.")}<p style="margin:24px 0 0;">${boton(diez, "Hacer 10 preguntas")}</p>`,
        urls.baja,
      ),
    };
  }

  if (tipo === "racha") {
    const texto = `Tu racha de ${racha} ${racha === 1 ? "día" : "días"} te espera. Hoy aún no has estudiado.\n\n${diez}\n\nDate de baja: ${urls.baja}`;
    return {
      asunto: `Tu racha de ${racha} ${racha === 1 ? "día" : "días"} te espera`,
      texto,
      html: marco(
        CLARA_HOLA,
        `${parrafo(`Llevas <strong>${racha}</strong> ${racha === 1 ? "día" : "días"} seguidos.`)}${parrafo("Hoy aún no has estudiado. Un test corto y la racha sigue.")}<p style="margin:24px 0 0;">${boton(diez, "Seguir la racha")}</p>`,
        urls.baja,
      ),
    };
  }

  if (tipo === "reenganche_3") {
    const texto = `Hace 3 días que no pasas por aquí. Diez preguntas y vuelves.\n\n${diez}\n\nDate de baja: ${urls.baja}`;
    return {
      asunto: "Hace 3 días que no pasas por aquí",
      texto,
      html: marco(
        CLARA_HOLA,
        `${parrafo("Hace 3 días que no estudias.")}${parrafo("El temario sigue donde lo dejaste. Diez preguntas bastan para volver.")}<p style="margin:24px 0 0;">${boton(diez, "Volver a estudiar")}</p>`,
        urls.baja,
      ),
    };
  }

  if (tipo === "reenganche_7") {
    const texto = `Una semana sin estudiar. Diez preguntas bastan para retomar.\n\n${diez}\n\nDate de baja: ${urls.baja}`;
    return {
      asunto: "Una semana sin estudiar",
      texto,
      html: marco(
        CLARA_HOLA,
        `${parrafo("Ha pasado una semana.")}${parrafo("No pasa nada. Diez preguntas y retomas el ritmo.")}<p style="margin:24px 0 0;">${boton(diez, "Retomar con 10 preguntas")}</p>`,
        urls.baja,
      ),
    };
  }

  if (tipo === "sin_test") {
    const texto = `Ayer creaste la cuenta y aún no has hecho un test. Empieza por 10 preguntas.\n\n${diez}\n\nDate de baja: ${urls.baja}`;
    return {
      asunto: "Tu test de 10 preguntas está listo",
      texto,
      html: marco(
        CLARA_HOLA,
        `${parrafo("Creaste la cuenta y el primer test sigue en blanco.")}${parrafo("Son 10 preguntas, con la explicación y el artículo.")}<p style="margin:24px 0 0;">${boton(diez, "Hacer el test")}</p>`,
        urls.baja,
      ),
    };
  }

  if (tipo === "tope") {
    const texto = `Hoy ya has hecho las 10 preguntas gratis. Mañana hay otras 10. Premium son ${mes} al mes o ${ano} al año.\n\n${precios}\n\nDate de baja: ${urls.baja}`;
    return {
      asunto: "Hoy ya has hecho las 10 gratis",
      texto,
      html: marco(
        CLARA_HOLA,
        `${parrafo("Hoy ya has llegado a las 10 preguntas gratis.")}${parrafo(`Mañana hay otras 10. Si quieres seguir ahora, Premium son ${escaparHtml(mes)} al mes o ${escaparHtml(ano)} al año.`)}<p style="margin:24px 0 0;">${boton(precios, "Ver Premium")}</p>`,
        urls.baja,
      ),
    };
  }

  const temaTexto = tema ? ` El tema que más se te resistió: ${tema}.` : "";
  const texto = `Esta semana: ${tests} ${tests === 1 ? "test" : "tests"} y ${aciertos} ${aciertos === 1 ? "acierto" : "aciertos"}.${temaTexto}\n\n${panel}\n\nDate de baja: ${urls.baja}`;
  return {
    asunto: "Tu semana en Oposiciones Claras",
    texto,
    html: marco(
      CLARA_CELEBRA,
      `${parrafo(`Esta semana: <strong>${tests}</strong> ${tests === 1 ? "test" : "tests"} y <strong>${aciertos}</strong> ${aciertos === 1 ? "acierto" : "aciertos"}.`)}${tema ? parrafo(`El tema que más se te resistió: ${escaparHtml(tema)}.`) : ""}${parrafo("Cuando quieras, seguimos por ahí.")}<p style="margin:24px 0 0;">${boton(panel, "Seguir estudiando")}</p>`,
      urls.baja,
    ),
  };
}

export function muestra(tipo: TipoEmail): DatosCorreo {
  if (tipo === "racha") return { racha: 4 };
  if (tipo === "resumen") return { tests: 6, aciertos: 41, tema: "12. El acto administrativo" };
  return { racha: 0, tests: 0, aciertos: 0, tema: null };
}
