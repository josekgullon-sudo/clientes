@AGENTS.md

# Plataforma de test para oposiciones

- Propuesta de diseño y plan: `docs/propuesta-fase-1.md`. Identidad «el temario subrayado»:
  sin tarjetas con sombra, filetes finos, cita legal con `.subrayado`, colores como tokens en
  `src/app/globals.css` (`papel`, `tinta`, `pizarra`, `pino`, `teja`, `subrayador`).
- Textos de la interfaz en español, frases cortas, segunda persona, sin mensajes de castigo.
- Mobile first: probar cada pantalla a 380 px (`npm run capturas`).
- Preguntas en `/preguntas/*.json`, esquema en `src/lib/preguntas/esquema.ts`. Nuevas siempre en
  `estado: "borrador"`. Solo se importan las `validada`.
- Fuentes legales en `/fuentes` (un archivo por ley).
