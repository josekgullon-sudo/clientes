@AGENTS.md

# Plataforma de test para oposiciones

- Estilo «app de juego» (tipo Duolingo) sobre la identidad pino y oro. Tokens en `src/app/globals.css`:
  `papel`, `superficie`, `tinta`, `pizarra`, `filete`, `pino` (acción, acierto), `teja` (fallo),
  `subrayador`/`oro-*` (XP, cita legal), `naranja-*` (racha), `cielo-*` (opción elegida, info),
  `morado-*` (Premium). Tarjetas `.tarjeta` y botones `Boton`/`EnlaceBoton` con canto inferior de
  relieve; variantes `principal`, `secundario`, `suave`, `texto`, `premium`, `error`.
- Titulares en Nunito (`font-display`, negrita 800-900); interfaz en Figtree; Source Serif 4 solo
  para el texto literal de la ley (explicaciones, citas). Cifras alineadas con `.cifras`.
- Mascota: Clara, un rotulador fluorescente (`components/mascota/clara.tsx`), con poses `hola`,
  `feliz`, `celebra`, `animo`, `piensa`, `duerme`, `premium`, `senala`. `ClaraDice` la pone con
  bocadillo. Todas las poses en `/vista/clara`. Úsala para guiar, celebrar y animar; nunca para reñir.
- Área privada: barra superior con racha, XP y Premium; navegación inferior en móvil. El camino es
  un zigzag de nodos (`components/estudio/camino-juego.tsx`). Durante un test no hay navegación;
  al corregir, Clara reacciona en el pie, suena un tono (se puede silenciar) y la explicación se ve abierta.
- Textos de la interfaz en español, frases cortas, segunda persona, sin mensajes de castigo.
- Mobile first: probar cada pantalla a 380 px. `npm run recorrido` (y `-- dark`) recorre la web
  entera, con registro, onboarding y una lección, y avisa si hay scroll horizontal.
- Preguntas en `/preguntas/*.json`, esquema en `src/lib/preguntas/esquema.ts`. Nuevas siempre en
  `estado: "borrador"`. Solo se importan las `validada`.
- Fuentes legales en `/fuentes` (un archivo por ley).
