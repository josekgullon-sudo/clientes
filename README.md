# clientes

Herramienta privada de prospección para agencia freelance de ecommerce: audita tiendas
en UX/UI/conversión y genera evidencia visual concreta para el contacto en frío.

Uso personal. No es un producto.

- **Contexto del proyecto y reglas de trabajo:** [`CLAUDE.md`](./CLAUDE.md)
- **Ideas aparcadas para fases posteriores:** [`IDEAS.md`](./IDEAS.md)

**Estado:** Fase 1 (Auditor). Esqueleto del pipeline: navega, respeta `robots.txt`
y captura en móvil. Todavía sin checks, así que toda auditoría sale con cero hallazgos.

## Puesta en marcha

```sh
npm install
npx playwright install chromium     # si no lo tienes ya en la máquina
cp .env.example .env                # y rellena AUDIT_CONTACTO
npm run db:init
```

`AUDIT_CONTACTO` es el correo o URL que va en el user-agent del bot, para que quien
vea la visita en sus logs sepa a quién escribir. Rellénalo antes de tocar sitios de
terceros.

## Uso

```sh
npm run auditar -- https://ejemplo.es      # audita una o varias URLs
npm run db:info                            # tablas y número de filas
npm test                                   # tests de esquema, URL, robots y extremo a extremo
```

Cada auditoría deja en `out/<dominio>/<sello-de-tiempo>/`:

| Fichero              | Qué es                                                  |
| -------------------- | ------------------------------------------------------- |
| `movil-completa.png` | Página entera, viewport 390×844 a 2x                    |
| `movil-plegado.png`  | Solo lo que se ve sin hacer scroll                      |
| `pagina.json`        | URL final, estado HTTP, título, user-agent, versión     |

Y en la base de datos, una fila en `auditorias` más una en `auditoria_fuentes` por
fuente externa (`robots`, `playwright`, `axe`, `psi`, `anthropic`) con su estado —
`ok`, `degradada`, `fallida` u `omitida`— y el error si lo hubo. Un fallo de PSI o de
la API de Anthropic no tumba la auditoría: se registra y el informe podrá decir qué
falta y por qué.

## `robots.txt`

Se respeta siempre, siguiendo RFC 9309:

- Sin `robots.txt` (4xx) → se audita, y queda registrado como degradado.
- `robots.txt` inaccesible (5xx, timeout, error de red) → **no se audita**. Si no
  sabemos qué permite el sitio, no entramos.
- `Disallow` aplicable → no se audita y no se escribe nada en disco.
- Se respeta `Crawl-delay`; por encima de `RETARDO_MAX_MS` se descarta la tienda.

Entre peticiones al mismo host se espera `RETARDO_MIN_MS` (2 s por defecto).
