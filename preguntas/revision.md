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
- El tema 15 solo tiene por ahora la Constitución (arts. 128-136). Falta la Ley 47/2003, General
  Presupuestaria, que no se pudo descargar (el entorno no llega a boe.es).
