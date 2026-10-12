import "server-only";
import { cache } from "react";
import { usuarioActual } from "./usuario";

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
  const { supabase } = await usuarioActual();
  const { error: alta } = await supabase.rpc("asegurar_perfil");
  if (alta) return null;
  const { data, error } = await supabase.rpc("estadisticas_usuario");
  if (error || !data) return null;
  return data as Estadisticas;
});
