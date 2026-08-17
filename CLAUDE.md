# CLAUDE.md

Contexto permanente del proyecto. Léelo al inicio de cada sesión.

## Qué es esto

Herramienta privada de prospección para mi agencia freelance de ecommerce. Uso personal exclusivo: no se vende, no se publica, no tiene usuarios más allá de mí. No construyas multi-tenant, auth, roles, facturación, onboarding ni landing.

El objetivo final es un pipeline que:

1. Descubre tiendas ecommerce que encajan con mi perfil de cliente
2. Audita cada una en UX, UI y conversión, generando evidencia visual concreta
3. Contacta por email en frío con hallazgos específicos de esa tienda
4. Clasifica las respuestas y me pasa las vivas
5. El cierre lo hago yo, por videollamada o WhatsApp

El eje del proyecto es la auditoría, no el envío. Lo que diferencia esto de cualquier herramienta de cold email es que el mensaje lleva dentro un hallazgo real y demostrable sobre la tienda del destinatario.

## Quién soy

Ecommerce Manager, 10+ años. Trabajo a diario con Shopify (incluido Plus y GraphQL Admin API), GA4, Klaviyo, Google Ads, Meta Ads y marketplaces. Programo (Node, React). No me expliques conceptos básicos ni justifiques decisiones obvias.

Enfoque comercial: UX, UI y mejora de web en general. No SEO. El SEO exige que te crean; la UX se demuestra con una captura.

## Fases

**Fase 1 — Auditor. ← ESTAMOS AQUÍ**
Dada una URL, produce hallazgos estructurados, capturas móviles anotadas e informe HTML.

**Fase 2 — Descubrimiento.**
Crawler que encuentra tiendas candidatas y las puntúa. Detección de plataforma, tamaño de catálogo vía `/products.json` en Shopify, señales de inversión publicitaria vía Meta Ads Library API, densidad de problemas detectados. Salida: lista priorizada que yo reviso a mano.

**Fase 3 — Contacto.**
Generación de emails con Claude API a partir del informe. Revisión manual obligatoria de los primeros 100. Envío delegado a Instantly o Smartlead vía API — no construimos capa de envío propia, ni SES ni nada parecido. Clasificador de respuestas.

**Fase 4 — Seguimiento.**
Pipeline mínimo. Probablemente Clientify, que ya lo tengo, en vez de construir CRM.

No trabajes en una fase que no sea la actual. Si se te ocurre algo de una fase posterior, apúntalo en `IDEAS.md` y sigue.

## Decisiones ya tomadas

No las reabras salvo que yo lo pida.

- Node.js + ESM. Sin TypeScript.
- SQLite (`better-sqlite3`). Sin ORM. Sin Postgres.
- Playwright (Chromium) para renderizado y capturas.
- axe-core para accesibilidad.
- PageSpeed Insights API para métricas de campo (CrUX).
- SDK de Anthropic, modelo `claude-sonnet-4-6`, para la capa de juicio cualitativo.
- Sin framework web. CLI y ficheros.
- Despliegue en VPS Ubuntu de Hostinger. Ya tengo otros proyectos Node ahí.
- El envío de email se delega a un proveedor externo por API.

Diseña el esquema de SQLite contemplando las fases futuras (tablas de tiendas, auditorías, hallazgos, contactos, envíos) aunque de momento solo se usen las primeras. Prefiero eso a migrar después.

## Restricciones no negociables

### Legales (España)

Que el proyecto sea privado no cambia nada de esto.

- Email en frío solo a buzones corporativos publicados en el aviso legal o la página de contacto: `info@`, `hola@`, `pedidos@`. Datos de persona jurídica, fuera del RGPD.
- Nunca a direcciones nominales (`nombre.apellido@empresa.com`) ni a nada extraído de LinkedIn. Eso es dato personal.
- Todo email lleva identificación completa y mecanismo de baja. Lista de supresión que se respeta al instante y de forma permanente.
- Registrar fuente y fecha de obtención de cada contacto. Es la trazabilidad que me defiende si alguien reclama.
- LSSI art. 21: las sanciones leves llegan a 30.000 €.

### WhatsApp

Nunca como canal de contacto en frío. La WhatsApp Business Platform exige opt-in y la ventana de 24h solo se abre si escribe el usuario. Enlace `wa.me` en el email; si escriben ellos, la conversación es legítima. Ninguna librería no oficial.

### Scraping

Respetar `robots.txt`. Rate limiting conservador. User-agent identificable. No tumbar la web de nadie.

## Cómo quiero que trabajes

- Por bloques pequeños, y yo valido cada uno. No implementes diez cosas de golpe.
- Si una heurística o un selector es frágil, dilo. Prefiero un hallazgo marcado como "no determinado" que un falso positivo silencioso. Un informe con falsos positivos delante de un cliente es peor que no mandar nada.
- Pregunta antes de asumir cualquier decisión de producto.
- Commits pequeños y descriptivos.
- Un fallo de la API de Anthropic o de PSI no puede tumbar una auditoría entera. Degradar con elegancia y dejar constancia en el informe.

## Criterio de validación

La herramienta se calibra contra tiendas que conozco al detalle. Sé qué falla en cada una. Si no lo detecta, o marca cosas que no son problema, está mal calibrada.

No se pasa a la Fase 2 hasta que los informes de esas tiendas coincidan con lo que yo veo a mano.
