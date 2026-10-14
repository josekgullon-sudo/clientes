import oposiciones from "../../datos/oposiciones.json";
import { diasEntre, hoyMadrid } from "@/lib/seo/seleccion";

export function examenEstimado(slug = "aux-age") {
  return oposiciones.find((o) => o.slug === slug)?.examen_estimado ?? null;
}

export function diasHastaExamenEstimado(fecha = new Date()) {
  const ex = examenEstimado();
  if (!ex) return null;
  return diasEntre(hoyMadrid(fecha), ex.fecha);
}
