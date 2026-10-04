# Oposiciones Claras

Primera oposición: Auxiliar Administrativo del Estado. Diseño y plan en `docs/propuesta-fase-1.md`.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase (Postgres + Auth) · Stripe · Vercel.

## En local

```bash
npm install
cp .env.example .env.local        # las claves de Supabase local salen de `npx supabase status`
npx supabase start                # Postgres, Auth y Mailpit en Docker
npx supabase db reset             # aplica supabase/migrations
npm run preguntas:importar -- --incluir-borradores   # en local también sube los borradores
npm run dev
```

Los correos de acceso (enlace mágico) llegan a Mailpit: http://127.0.0.1:54324.
Para probar sin Stripe, activa una suscripción a mano:

```sql
insert into suscripciones (usuario_id, plan, estado, fin_periodo)
select id, 'mensual', 'active', now() + interval '30 days' from auth.users where email = 'tu@correo.es';
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run preguntas:validar` | Comprueba el esquema y las reglas de calidad de `/preguntas` |
| `npm run preguntas:duplicados` | Busca preguntas casi iguales |
| `npm run preguntas:estadisticas` | Preguntas por tema, dificultad y estado |
| `npm run preguntas:importar` | Sube a Supabase el catálogo y las preguntas `validada` |
| `npm run capturas -- /ruta` | Capturas a 380 px en claro y oscuro (con `npm run dev` arrancado) |
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
