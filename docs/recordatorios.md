# Recordatorios de racha

El envío está preparado y no se activa solo. La app funciona igual si estas variables están vacías.

## Qué hace

`POST` o `GET /api/cron/recordatorios` con la cabecera `Authorization: Bearer $CRON_SECRET`:

1. Llama a `mantenimiento_rachas()`: si ayer no se cumplió el objetivo y queda un protector, lo consume; si el hueco es mayor, la racha pasa a 0 y queda reparable 24 horas (dos lecciones).
2. Lee `usuarios_recordatorio()`:
   - tipo `racha`: racha de 2 días o más y hoy todavía no ha estudiado;
   - tipo `reactivacion`: último día activo hace 3, 7 o 14 días.
3. Si faltan `RESEND_API_KEY` o `RECORDATORIO_FROM`, responde `{ estado: "preparado" }` y no marca nada como enviado.
4. Si están, envía el correo con la API de Resend y guarda la fila en `notificaciones_enviadas` para no repetir el mismo día.

La baja es la casilla «Recordatorio por correo» en `/app/cuenta` (`perfil_estudio.recordatorio_email`).

## Cómo programarlo

No hay cron en `vercel.json`. En el panel de Vercel (o un cron externo) se puede llamar cada hora, o una vez al día sobre las 20:00 de Madrid:

```
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/cron/recordatorios" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Pendiente

- Resumen semanal.
- Avisos de convocatoria.
- Push web (PWA). La tabla `suscripciones_push` existe; no hay service worker ni petición de permiso.
- Las plantillas de Supabase Auth (código de 6 dígitos) hay que pegarlas en el proyecto alojado. `supabase/config.toml` solo aplica en local.
