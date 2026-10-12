@AGENTS.md

# Plataforma de test para oposiciones

- Identidad «el temario subrayado», versión pino y oro. Tokens en `src/app/globals.css`:
  `papel` (fondo), `superficie` (tarjetas, clase `.tarjeta`), `tinta`, `pizarra`, `filete`,
  `pino` (acción y acierto), `teja` (fallo, siempre suave), `subrayador`/`oro-*` (cita legal,
  logros). Cita legal con `.subrayado`. Letra de interfaz Figtree; titulares en Source Serif 4.
  Cifras alineadas con `.cifras`. Botones con `Boton`/`EnlaceBoton` (`principal`, `secundario`,
  `suave`, `texto`).
- Área privada: navegación inferior en móvil y arriba en escritorio (`components/app/nav-app.tsx`).
  Durante un test no hay navegación: solo la pregunta, el progreso y el botón al alcance del pulgar.
  La explicación se muestra abierta al corregir.
- Textos de la interfaz en español, frases cortas, segunda persona, sin mensajes de castigo.
- Mobile first: probar cada pantalla a 380 px. `npm run recorrido` (y `-- dark`) recorre la web
  entera, con registro, onboarding y una lección, y avisa si hay scroll horizontal.
- Preguntas en `/preguntas/*.json`, esquema en `src/lib/preguntas/esquema.ts`. Nuevas siempre en
  `estado: "borrador"`. Solo se importan las `validada`.
- Fuentes legales en `/fuentes` (un archivo por ley).
