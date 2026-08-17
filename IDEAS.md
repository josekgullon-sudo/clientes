# IDEAS.md

Cosas que se me (o se le) ocurren fuera de la fase actual. No se implementan aquí. Se apuntan y se sigue.

Formato: `- [Fase N] Idea. Contexto de por qué.`

---

## Pendientes de decidir (Fase 1)

- **Modelo de la capa de juicio.** `claude-sonnet-4-6` está activo y es válido. Existe `claude-sonnet-5`: misma familia, calidad cercana a Opus en tareas agénticas, tokenizer nuevo (~30% más tokens para el mismo texto, precio por token sin cambios), `effort` hasta `xhigh`, visión de alta resolución (2576px lado largo, relevante si le pasamos capturas). Decisión tuya; de momento seguimos con 4.6.
- **Notas de API para cuando toque escribir la capa de juicio (aplican a 4.6 y a 5):**
  - `thinking: {type: "enabled", budget_tokens: N}` está deprecado en 4.6 y da 400 en Sonnet 5. Usar `thinking: {type: "adaptive"}` + `output_config: {effort: ...}`.
  - Los prefills de turno assistant dan 400 en ambos. Para forzar formato de salida usar `output_config.format` (structured outputs con JSON Schema) — encaja bien con hallazgos estructurados.
  - Cabeceras beta `effort-*`, `interleaved-thinking-*`, `fine-grained-tool-streaming-*` ya son GA: no hacen falta, y se puede usar `client.messages.create` en vez de `client.beta.messages.create`.
  - Prompt caching: el prefijo del sistema (rúbrica de auditoría, criterios) es estable entre tiendas → candidato claro a `cache_control`. Mínimo cacheable en Sonnet 4.6: 1024 tokens.

---

## Fase 2 — Descubrimiento

_(vacío)_

## Fase 3 — Contacto

_(vacío)_

## Fase 4 — Seguimiento

_(vacío)_
