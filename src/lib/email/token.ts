import { createHmac, timingSafeEqual } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function firmarBaja(usuarioId: string, secreto: string): string {
  const mac = createHmac("sha256", secreto).update(`baja:${usuarioId}`).digest("base64url");
  return `${usuarioId}.${mac}`;
}

/** Null si el enlace está manipulado o el secreto es corto. */
export function leerBaja(token: string, secreto: string): string | null {
  if (!secreto || secreto.length < 16) return null;
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const id = token.slice(0, i);
  const mac = token.slice(i + 1);
  if (!UUID.test(id) || !mac) return null;
  const esperado = createHmac("sha256", secreto).update(`baja:${id}`).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}
