# Preguntas para revisión humana

Anota aquí las preguntas dudosas que salgan de la validación: id, archivo y motivo.

## Revisión del 2026-10-12

- **Lotes de arranque** contrastados con `/fuentes` (Constitución, versión BOE 2026-05-20; Ley
  39/2015, versión 2024-11-07). Las 58 preguntas pasan a `validada`. Correcciones: ce-017 (cita
  «artículo 65, 2» literal), l39-007 (la cita era del art. 23.2; se cambia por el literal del
  art. 32.3), l39-016 (cita literal del art. 83.2), l39-011 (artículo citado 47.1 → 48.1, que
  es de donde sale la respuesta correcta).
- **ce-010**: el enunciado ya dice «Según el texto del artículo 15» y la explicación aclara que
  la ley penal militar ya no la contempla. Validada.
- **Reforma de 19 de mayo de 2026** (BOE-A-2026-10881): cambia el art. 69.3 (Ibiza y Formentera
  pasan a ser circunscripciones distintas). No afecta a ce-021, pero hay que tenerla en cuenta
  al escribir preguntas sobre el Senado.
- **Temario y simulacro** verificados con la Resolución de 18 de diciembre de 2025 (BOE-A-2025-26262),
  anexo I. Son 28 temas (16 + 12) y el bloque II se numera 17–28. Las preguntas de los lotes se
  han reasignado a los temas nuevos (la Ley 39/2015 pasa al tema 11).

## Dudosas

Ninguna por ahora.

### Lotes del 2026-10-12 (Ley 40/2015, TREBEP y art. 69.3 CE)

- ~~**l40-040**~~ Resuelta el 2026-10-12: se cambió el distractor y está validada. (Antes: art. 72.3): un distractor dice que los Delegados del Gobierno
  dependen orgánicamente del Ministro de Hacienda. El art. 69.3 del texto consolidado sigue
  adscribiendo las Delegaciones al «Ministerio de Hacienda y Administraciones Públicas» (nombre
  antiguo), así que la opción puede confundir. Hay que cambiar ese distractor.
- **ce-033** (`constitucion-arranque-art1-167.json`, art. 69.3): la cita viene de la nota del BOE
  sobre la disposición transitoria única de la reforma de 2026, no del texto del artículo. Hay que
  comprobarla con el texto de la reforma (BOE-A-2026-10881).
- **TREBEP, art. 49**: el BOE ya ha publicado una versión que entra en vigor el 2026-10-23
  (BOE-A-2026-20528). `fuentes/trebep.txt` recoge la versión vigente hoy. No hay preguntas sobre el
  art. 49; hay que actualizar la fuente después de esa fecha.
- Los textos consolidados mantienen algunos nombres de ministerios antiguos («Ministerio de Hacienda
  y Administraciones Públicas»). Evita preguntar por ministerios concretos.

### Lotes del 2026-10-12 (bloque I: Corona, Cortes, Gobierno, protección de datos, igualdad)

- Fuentes nuevas: `ley-50-1997.txt`, `lo-3-2018.txt`, `lo-3-2007.txt`, `lo-1-2004.txt`.
- **Unión Europea (tema 10)**: sin lote. El BOE no ofrece texto consolidado del TUE ni del TFUE en
  su API de legislación consolidada. Hay que usar la versión consolidada de EUR-Lex.
- **gob-** y **ig-**: el texto consolidado de algunas leyes mantiene nombres antiguos de ministerios
  (p. ej. el Observatorio Estatal, «adscrito al Ministerio de Trabajo y Asuntos Sociales»). Las
  preguntas evitan preguntar por el ministerio de adscripción.
- Las 3 preguntas del art. 69.3 (ce-031 a ce-033) pasan de `constitucion-arranque-art1-167.json`
  a `constitucion-cortes-art66-96.json`, y el lote de arranque vuelve a tener 30. Partirlo en dos
  dejaba dos lotes por debajo del mínimo de 20.

## Revisión del 2026-10-13

- Nuevo script `npm run preguntas:citas`: cada cita «…» de las explicaciones debe aparecer literal
  en `/fuentes`. Todo el banco anterior lo pasa.
- **poder-judicial-ce117-127** (25, tema 4), **economia-hacienda-ce128-136** (20, tema 15) y
  **atencion-ciudadano-ley39** (25, tema 17): redactados a partir de `/fuentes`, citas comprobadas
  por script y revisados pregunta a pregunta contra el artículo. Pasan a `validada`.
- **organizacion-territorial-ce137-158** (30, tema 9): revisado y `validada`.
- **age-ley40-art54-80** (25, tema 8): revisado y `validada`.
- **administracion-electronica** (30, tema 20): revisado y `validada`.
- **constitucion-derechos-art10-55** (30, tema 1): revisado y `validada`.
- **registro-archivo-ley39** (25, tema 19) y **lo-3-2018-derechos-digitales** (25, tema 12): revisados y `validada`.
- **pd-019** y **pd-020**: corregida la referencia (12.2 → 12.1 y 12.4 → 12.7).
- **trebep-conducta-acceso** (30, temas 13 y 14): revisado y `validada`.
- **transparencia-ley19-2013** (30, tema 7) y **gobierno-ley50-1997-ampliacion** (25, tema 5): revisados y `validada`.
- **presupuesto-ley47-2003** (30, tema 15) e **informacion-atencion-rd208-rd951** (30, temas 17 y 18): revisados y `validada`. Del RD 208/1996 solo se pregunta por artículos vigentes.
- **regimen-local-ley7-1985** (30, tema 9): revisado y `validada`.
- **word-365** (29, tema 24): primer lote de ofimática, con páginas de Microsoft en `fuentes/microsoft`.
  Se retira wrd-008 (Alt, P para Disposición): las teclas de acceso de la cinta cambian con el idioma.
  **Ojo con los atajos**: la página de Microsoft en español mezcla atajos de la versión inglesa
  (Ctrl+A abrir y seleccionar todo, Ctrl+I cursiva…). Solo se preguntan atajos sin contradicción e
  iguales en el teclado español (F12, Ctrl+Entrar, Ctrl+Alt+1, Ctrl+B para Navegación…).
- **union-europea-tue-tfue** (29, tema 10): revisado y `validada`. Se retira ue-027 (ocho
  abogados generales, art. 252 TFUE): el Consejo los ha aumentado y la cifra literal confunde.
  ue-019 pregunta por el texto del 17.5 TUE (dos tercios, salvo decisión unánime del Consejo Europeo).
- **reglamento-electronico-rd203-2021** (30, temas 19 y 20) y **excel-365** (30, tema 25): revisados y `validada`. En Excel solo hay atajos iguales en cualquier idioma (F2, F4, F9, F11, Mayús+F3, Mayús+F11, Alt+=).
- **windows-11** (30, tema 22): revisado y `validada`. Solo atajos con la tecla Windows o universales; descartados los que la página de Microsoft da con dos significados (Windows+A, +C, +S, +Q).
- Fuentes nuevas, descargadas con `python3 scripts/descargar_boe.py`: Ley 19/2013, Ley 47/2003,
  RD 208/1996, RD 203/2021, RD 951/2005, Ley 7/1985 (Bases de Régimen Local) y LO 6/1985 (Poder
  Judicial). Sirven para los temas 4, 6, 7, 9, 15, 17, 18, 19 y 20.
