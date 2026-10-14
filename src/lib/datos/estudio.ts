import "server-only";
import { cache } from "react";
import type { NodoCamino } from "@/lib/estudio/camino";
import { hoyMadrid } from "@/lib/seo/seleccion";
import { clienteSesion } from "./usuario";

export type ParteNota = { nota: number; bajo: number; alto: number };

export type Estadisticas = {
  objetivo_diario: number;
  fecha_examen: string | null;
  preguntas_hoy: number;
  aciertos_hoy: number;
  xp_hoy: number;
  xp_total: number;
  racha_actual: number;
  racha_maxima: number;
  protectores: number;
  recordatorio_email: boolean;
  onboarding_completado: boolean;
  premium: boolean;
  respuestas_total: number;
  acierto_global: number | null;
  acierto_7: number | null;
  acierto_30: number | null;
  velocidad_media_s: number | null;
  temas: {
    tema_id: string;
    numero: number;
    titulo: string;
    bloque: string;
    total: number;
    vistas: number;
    dominadas: number;
    nivel?: number;
    dominadas_sr?: number;
    corona?: string | null;
  }[];
  bloques: { bloque: string; total: number; vistas: number; dominadas: number }[];
  heatmap: { dia: string; preguntas: number }[];
  prediccion: {
    suficiente: boolean;
    respuestas: number;
    parte1?: ParteNota | null;
    parte2?: ParteNota | null;
    debilidades?: { numero: number; titulo: string; bloque: string; probabilidad: number; peso: number }[];
  };
};

export const estadisticasUsuario = cache(async (): Promise<Estadisticas | null> => {
  const supabase = await clienteSesion();
  // estadisticas_usuario ya crea el perfil si falta (asegurar_perfil).
  const { data, error } = await supabase.rpc("estadisticas_usuario");
  if (error || !data) return null;
  return data as Estadisticas;
});

export const caminoTemas = cache(async (): Promise<NodoCamino[] | null> => {
  const supabase = await clienteSesion();
  const { data, error } = await supabase.rpc("camino_temas");
  if (error || !data) return null;
  return data as NodoCamino[];
});

export type LogroUsuario = {
  catalogo_id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  conseguido_en: string | null;
};

export const logrosUsuario = cache(async (): Promise<LogroUsuario[] | null> => {
  const supabase = await clienteSesion();
  const { data: catalogo, error } = await supabase
    .from("logros")
    .select("catalogo_id, nombre, descripcion, icono, orden")
    .order("orden");
  if (error || !catalogo) return null;
  const { data: mios } = await supabase.from("logros_usuario").select("logro_id, conseguido_en");
  const mapa = new Map((mios ?? []).map((m) => [m.logro_id as string, m.conseguido_en as string]));
  return catalogo.map((l) => ({
    catalogo_id: l.catalogo_id as string,
    nombre: l.nombre as string,
    descripcion: l.descripcion as string,
    icono: l.icono as string,
    conseguido_en: mapa.get(l.catalogo_id as string) ?? null,
  }));
});

export type PerfilPublico = { alias: string; avatar: string; en_liga: boolean; personalizado: boolean };

export const perfilPublico = cache(async (): Promise<PerfilPublico | null> => {
  const supabase = await clienteSesion();
  const { data, error } = await supabase.rpc("mi_perfil_publico");
  if (error || !data) return null;
  return data as PerfilPublico;
});

export type FilaLiga = { pos: number; alias: string; avatar: string; xp: number; racha: number; yo: boolean };
export type Liga = { inicio: string; fin: string; participantes: number; filas: FilaLiga[]; mi_posicion: number | null };

export const ligaSemanal = cache(async (): Promise<Liga | null> => {
  const supabase = await clienteSesion();
  const { data, error } = await supabase.rpc("liga_semanal");
  if (error || !data) return null;
  return data as Liga;
});

/** XP del cofre de hoy, o null si aún no se ha abierto. */
export const cofreHoy = cache(async (): Promise<number | null> => {
  const supabase = await clienteSesion();
  const hoy = hoyMadrid();
  const { data } = await supabase.from("cofres_diarios").select("xp").eq("dia", hoy).maybeSingle();
  return (data?.xp as number | undefined) ?? null;
});

export type DiaActividad = { dia: string; preguntas: number; objetivo_cumplido: boolean; protector_usado: boolean };

/** Actividad de los últimos días, para el calendario de la racha. */
export const actividadReciente = cache(async (dias = 42): Promise<DiaActividad[]> => {
  const supabase = await clienteSesion();
  const desde = new Date(Date.now() - dias * 86400000);
  const { data } = await supabase
    .from("actividad_diaria")
    .select("dia, preguntas, objetivo_cumplido, protector_usado")
    .gte("dia", hoyMadrid(desde))
    .order("dia");
  return (data ?? []) as DiaActividad[];
});
