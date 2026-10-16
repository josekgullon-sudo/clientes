import "server-only";
import { cache } from "react";
import { hoyMadrid } from "@/lib/seo/seleccion";
import { clienteSesion } from "./usuario";

export type EstadoNivel = {
  hecho: boolean;
  omitido: boolean;
  abierto: string | null;
  /** Primera visita, sin ningún test terminado: hay que ofrecer el de nivel. */
  mostrar: boolean;
};

export type EstadoHoy = {
  hecho: boolean;
  abierto: string | null;
};

/** Null si la migración aún no está aplicada: la app sigue sin bloquear a nadie. */
export const estadoNivel = cache(async (): Promise<EstadoNivel | null> => {
  try {
    const supabase = await clienteSesion();
    const [{ data: perfil, error: errorPerfil }, { data: deNivel, error: errorNivel }, { count, error: errorCuenta }] =
      await Promise.all([
        supabase.from("perfil_estudio").select("nivel_omitido_en").maybeSingle(),
        supabase.from("intentos").select("id, terminado_en").eq("modo", "nivel").order("creado_en", { ascending: false }).limit(1),
        supabase.from("intentos").select("id", { count: "exact", head: true }).not("terminado_en", "is", null).neq("modo", "nivel"),
      ]);
    if (errorPerfil || errorNivel || errorCuenta) return null;
    const ultimo = deNivel?.[0];
    const hecho = Boolean(ultimo?.terminado_en);
    const abierto = ultimo && !ultimo.terminado_en ? ultimo.id : null;
    const omitido = Boolean(perfil?.nivel_omitido_en);
    return {
      hecho,
      omitido,
      abierto,
      mostrar: !hecho && !omitido && !abierto && (count ?? 0) === 0,
    };
  } catch {
    return null;
  }
});

/** El test de hoy de esta persona, si ya lo empezó. Null si el modo aún no existe. */
export const estadoTestHoy = cache(async (): Promise<EstadoHoy | null> => {
  try {
    const supabase = await clienteSesion();
    const { data, error } = await supabase
      .from("intentos")
      .select("id, terminado_en, creado_en")
      .eq("modo", "hoy")
      .order("creado_en", { ascending: false })
      .limit(8);
    if (error) return null;
    const hoy = hoyMadrid();
    const deHoy = (data ?? []).filter((fila) => hoyMadrid(new Date(fila.creado_en)) === hoy);
    const abierto = deHoy.find((fila) => !fila.terminado_en);
    return { hecho: deHoy.some((fila) => fila.terminado_en), abierto: abierto?.id ?? null };
  } catch {
    return null;
  }
});
