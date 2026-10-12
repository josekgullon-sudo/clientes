/** Respuestas del test público, para importarlas al crear la cuenta. */
export const CLAVE_DEMO = "oc-respuestas-publicas";

export type DemoGuardada = {
  v: 1;
  origen: string;
  fallos: number;
  respuestas: { pregunta_id: string; respuesta: number | null }[];
};

export function esDemoGuardada(valor: unknown): valor is DemoGuardada {
  if (!valor || typeof valor !== "object") return false;
  const v = valor as DemoGuardada;
  return v.v === 1 && typeof v.origen === "string" && Array.isArray(v.respuestas);
}
