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
- Logo: la cara de Clara (`MarcaLogo` en `components/logo.tsx`, también `app/icon.svg`).
- Área privada: barra superior con racha (→ `/app/racha`), XP (→ `/app/liga`) y Premium; navegación
  inferior en móvil con Hoy, Camino, Liga, Progreso y Perfil. Misiones diarias con cofre de XP
  (`components/estudio/cofre.tsx`, RPC `abrir_cofre`). Liga semanal por XP (`liga_semanal`) con alias
  y avatar de animal (`lib/estudio/perfil.ts`); nunca se muestra el correo. El camino es
  un zigzag de nodos (`components/estudio/camino-juego.tsx`). Durante un test no hay navegación;
  al corregir, Clara reacciona en el pie, suena un tono (se puede silenciar) y la explicación se ve abierta.
- Textos de la interfaz en español, frases cortas, segunda persona, sin mensajes de castigo.
- Mobile first: probar cada pantalla a 380 px. `npm run recorrido` (y `-- dark`) recorre la web
  entera, con registro, onboarding y una lección, y avisa si hay scroll horizontal.
- Preguntas en `/preguntas/*.json`, esquema en `src/lib/preguntas/esquema.ts`. Nuevas siempre en
  `estado: "borrador"`. Solo se importan las `validada`.
- Fuentes legales en `/fuentes` (un archivo por ley).
- Cuatro oposiciones (`datos/oposiciones.json`): `aux-age` (28 temas legales y de ofimática + bloque III de psicotécnicos, temas 29 a 32) y
  `admin-age` (45 temas del anexo III de BOE-A-2025-26262). Cada persona elige la suya (`perfil_estudio.oposicion`); una pregunta puede
  llevar tema en las dos (`temas: { "aux-age": 13, "admin-age": 26 }`). Los psicotécnicos (`ley: "psicotecnico"`, sin artículo ni BOE) se
  generan con `npx tsx scripts/generar-psicotecnicos.ts` (series, cálculo, plazos, DNI… calculados por programa) y la parte verbal está
  escrita a mano en `scripts/lib/psicotecnicos-verbal.ts`. Las páginas públicas `/test/<slug>` cubren: leyes y temas del Auxiliar (como siempre), un tema por página de Administrativo, Agente de Hacienda y Tramitación Procesal (prefijo `administrativo-`, `agente-hacienda-`, `tramitacion-procesal-`; solo temas con preguntas) y las normas que solo usan esas oposiciones (LGT, LEC…). La portada y el reto solo usan las del Auxiliar (`ambito: "aux"` en `rutasPublicas`). `agente-aeat` (Agente de la Hacienda Pública, C1: 32 temas, 90 min, 80 preguntas, penalización ¼, nota sobre 10; formato con `escala: 10`) reúne temas comunes (1-7, 8-12 de Derecho administrativo) y 20 materias tributarias (13-32) con las normas de `fuentes/` de LGT, reglamentos, IRPF, IS, IVA y Código Aduanero (texto original de 2013: solo artículos estables). `npx tsx scripts/recorrido.ts agente` recorre la web con esa oposición. `tramitacion-procesal` (Tramitación Procesal y Administrativa, Justicia, C1: 37 temas del anexo VI.b de BOE-A-2025-27053; simulacro de 120 preguntas y 140 min = primer ejercicio de 100 test + 20 de ofimática, penalización ¼, escala 10) usa LOPJ, LEC, LECrim, LRJS, Ley 20/2011 y demás normas procesales de `fuentes/`; el caso práctico no se practica. Los temas 1-6 y 32-37 reutilizan preguntas del Auxiliar. `scripts/recorrido.ts tramitacion` la recorre.
