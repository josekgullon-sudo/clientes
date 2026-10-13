/** Avatares del perfil público. Mismo orden que public._avatares() en la base de datos. */
export const AVATARES = {
  zorro: { nombre: "Zorro", emoji: "🦊", fondo: "#ffedd5" },
  panda: { nombre: "Panda", emoji: "🐼", fondo: "#e2e8f0" },
  buho: { nombre: "Búho", emoji: "🦉", fondo: "#fef3c7" },
  tortuga: { nombre: "Tortuga", emoji: "🐢", fondo: "#dcfce7" },
  pinguino: { nombre: "Pingüino", emoji: "🐧", fondo: "#e0f2fe" },
  leon: { nombre: "León", emoji: "🦁", fondo: "#fef9c3" },
  koala: { nombre: "Koala", emoji: "🐨", fondo: "#f1f5f9" },
  rana: { nombre: "Rana", emoji: "🐸", fondo: "#d9f99d" },
  tigre: { nombre: "Tigre", emoji: "🐯", fondo: "#ffedd5" },
  conejo: { nombre: "Conejo", emoji: "🐰", fondo: "#fce7f3" },
  oso: { nombre: "Oso", emoji: "🐻", fondo: "#fde68a" },
  pulpo: { nombre: "Pulpo", emoji: "🐙", fondo: "#ede9fe" },
} as const;

export type ClaveAvatar = keyof typeof AVATARES;

export function avatar(clave: string | null | undefined) {
  return AVATARES[(clave ?? "") as ClaveAvatar] ?? AVATARES.zorro;
}

export function aliasValido(alias: string) {
  const a = alias.trim().replace(/\s+/g, " ");
  return a.length >= 3 && a.length <= 20 && /^[\p{L}\p{N} ._-]+$/u.test(a);
}
