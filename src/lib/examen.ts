import oposiciones from "../../datos/oposiciones.json";
import { diasEntre, hoyMadrid } from "@/lib/seo/seleccion";

export function examenEstimado() {
  return oposiciones.find((o) => o.slug === "aux-age")?.examen_estimado ?? null;
}

export function diasHastaExamenEstimado(fecha = new Date()) {
  const ex = examenEstimado();
  if (!ex) return null;
  return diasEntre(hoyMadrid(fecha), ex.fecha);
}
