# Avisos por correo

El cron de Vercel llama una vez al día, a las 16:00 UTC, a `GET /api/cron/emails` con `Authorization: Bearer $CRON_SECRET`. En Madrid son las 18:00 en horario de verano y las 17:00 en invierno. El plan Hobby solo admite crons diarios.

Fuera de las 9:00–21:00 de Madrid no envía. Esa pasada cae dentro. La racha sale desde las 17:00. Como mucho, un correo por persona y día. Quien se da de baja, o apaga la casilla de la cuenta, no recibe más avisos. Una cuenta borrada deja de existir en el envío.

Si faltan `RESEND_API_KEY` o `CRON_SECRET` (mínimo 16 caracteres), no se marca ningún envío.

`/api/cron/recordatorios` hace el mismo envío, por si aún apunta ahí un cron antiguo.

La vista previa está en `/admin/emails`.
