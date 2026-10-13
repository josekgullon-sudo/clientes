"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { Boton } from "@/components/boton";
import { compartirTarjeta } from "@/lib/ui/compartir";

/** Botón que comparte la tarjeta con imagen de la racha o del reto. */
export function BotonCompartir({
  tipo,
  n,
  texto,
  ruta,
  etiqueta = "Compartir",
  variante = "principal",
}: {
  tipo: "racha" | "reto";
  n: number;
  texto: string;
  ruta: string;
  etiqueta?: string;
  variante?: "principal" | "secundario";
}) {
  const [estado, setEstado] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Boton
        type="button"
        ancho
        variante={variante}
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          const r = await compartirTarjeta(tipo, n, texto, ruta);
          setOcupado(false);
          setEstado(r === "copiado" ? "Texto copiado. Pégalo donde quieras." : null);
        }}
      >
        <Share2 aria-hidden size={18} /> {ocupado ? "Preparando…" : etiqueta}
      </Boton>
      {estado && (
        <p role="status" className="text-center text-sm font-bold text-pino">
          {estado}
        </p>
      )}
    </div>
  );
}
