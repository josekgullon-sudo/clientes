# Fuentes legales

Un archivo por ley con el texto consolidado del BOE (por ejemplo `ley-39-2015.txt`).
El nombre coincide con el `slug` de `datos/leyes.json`. Indica al principio del archivo la
fecha de la última actualización del texto consolidado, que se copia a `fecha_version_boe`.

Para ofimática, enlaza la documentación oficial de Microsoft en el campo `fuente` de cada pregunta.

Para ofimática, descarga la página oficial de Microsoft con
`python3 scripts/descargar_web.py URL slug "Título"` (queda en `fuentes/microsoft/`) y pon esa misma
URL en el campo `fuente` de cada pregunta. `npm run preguntas:citas` comprueba las citas contra ella.
