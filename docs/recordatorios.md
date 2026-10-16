# Avisos por correo

El cron de Vercel llama cada hora a `GET /api/cron/emails` con `Authorization: Bearer $CRON_SECRET`.

Fuera de las 9:00–21:00 de Madrid no envía. La racha sale a partir de las 19:00. Como mucho, un correo por persona y día. Quien se da de baja, o apaga la casilla de la cuenta, no recibe más avisos. Una cuenta borrada deja de existir en el envío.

Si faltan `RESEND_API_KEY` o `CRON_SECRET` (mínimo 16 caracteres), no se marca ningún envío.

`/api/cron/recordatorios` hace el mismo envío, por si aún apunta ahí un cron antiguo.

La vista previa está en `/admin/emails`.
