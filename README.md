# Oposiciones Claras

Primera oposición: Auxiliar Administrativo del Estado. Diseño y plan en `docs/propuesta-fase-1.md`.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase (Postgres + Auth) · Stripe · Vercel.

## Probarla en tu ordenador

Necesitas [Node.js 20 o superior](https://nodejs.org) y [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto.

```bash
git clone https://github.com/josekgullon-sudo/clientes.git
cd clientes
git checkout claude/oposiciones-test-platform-6ga336
npm install
cp .env.example .env.local
npx supabase start                # la primera vez descarga imágenes: unos minutos
npx supabase db reset             # crea las tablas
npm run preguntas:importar -- --incluir-borradores
npm run dev
```

Abre http://localhost:3000. Para entrar con tu correo, el enlace no llega a tu bandeja: lo
ves en Mailpit, http://127.0.0.1:54324. Para probar el área de pago sin Stripe:

```bash
npm run local:suscribir -- tu@correo.es
```

Para verla en el móvil, conecta el móvil a la misma wifi y abre `http://IP-DE-TU-ORDENADOR:3000`
(el inicio de sesión desde el móvil no funcionará en local; la demo y los test gratis sí).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run preguntas:validar` | Comprueba el esquema y las reglas de calidad de `/preguntas` |
| `npm run preguntas:duplicados` | Busca preguntas casi iguales |
| `npm run preguntas:estadisticas` | Preguntas por tema, dificultad y estado |
| `npm run preguntas:importar` | Sube a Supabase el catálogo y las preguntas `validada` |
| `npm run capturas -- /ruta` | Capturas a 380 px en claro y oscuro (con `npm run dev` arrancado) |
| `npm run local:suscribir -- correo` | Activa una suscripción de prueba en local |
| `npm test` · `npm run lint` · `npm run typecheck` | Comprobaciones |

## Producción

1. **Supabase**: crea el proyecto, `npx supabase link` y `npx supabase db push`.
   En Authentication → URL Configuration, pon la URL de la web como *Site URL* y añade
   `https://TU-DOMINIO/auth/callback` a las *Redirect URLs*. Para Google, activa el proveedor
   con un cliente OAuth de Google Cloud. Personaliza en español la plantilla del correo *Magic Link*.
2. **Stripe**: crea un producto con dos precios recurrentes (mensual y anual, IVA incluido),
   activa Stripe Tax, configura el portal de cliente y la URL de las condiciones
   (`/legal/condiciones`), que Checkout pide aceptar. Crea un webhook a
   `https://TU-DOMINIO/api/stripe/webhook` con `checkout.session.completed` y `customer.subscription.*`.
3. **Vercel**: importa el repositorio y añade las variables de `.env.example`.
4. Importa las preguntas: `npm run preguntas:importar` con las claves de producción.

## Pendiente antes de publicar

- Textos del BOE en `/fuentes` y validación de los lotes de arranque (ver `preguntas/revision.md`).
- Temario y formato del simulacro definitivos (`datos/oposiciones.json`, `"verificado": false`).
- Datos del titular para los textos legales (`TITULAR` en `src/lib/sitio.ts`) y revisión legal.
- Registrar los dominios `oposicionesclaras.es` y `.com` y comprobar la marca en la OEPM.
