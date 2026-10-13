import type { Metadata } from "next";
import { RetoRelampago } from "@/components/reto/reto-relampago";
import { preguntasReto } from "@/lib/seo/banco";
import { hoyMadrid } from "@/lib/seo/seleccion";
import { supabaseServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = {
  title: "Reto relámpago",
  description: "60 segundos para acertar todas las preguntas que puedas del Auxiliar Administrativo del Estado. Un reto nuevo cada día.",
};

export default async function Reto() {
  const dia = hoyMadrid();
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <RetoRelampago key={dia} preguntas={preguntasReto(dia)} dia={dia} conSesion={!!user} />;
}
