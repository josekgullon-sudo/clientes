"use client";

import { useActionState } from "react";
import { Boton } from "@/components/boton";
import { enviarEnlace, entrarConGoogle, type EstadoEntrar } from "./acciones";

export function FormularioEntrar({ siguiente }: { siguiente: string }) {
  const [estado, accion, enviando] = useActionState<EstadoEntrar, FormData>(enviarEnlace, {});

  if (estado.enviado) {
    return (
      <div role="status" className="border-l-[3px] border-pino pl-4">
        <p className="font-serif text-xl font-semibold">Revisa tu correo</p>
        <p className="mt-2">
          Te hemos enviado un enlace a <strong>{estado.enviado}</strong>. Ábrelo en este dispositivo para entrar.
        </p>
        <p className="mt-2 text-[0.95rem] text-pizarra">Si no lo ves en unos minutos, mira en la carpeta de spam.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={accion} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="siguiente" value={siguiente} />
        <label htmlFor="email" className="font-semibold">
          Tu correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={!!estado.error}
          aria-describedby={estado.error ? "error-email" : "ayuda-email"}
          className="min-h-14 rounded-md border border-pizarra/70 bg-papel px-4 text-[1.0625rem] placeholder:text-pizarra/70"
          placeholder="nombre@correo.es"
        />
        {estado.error ? (
          <p id="error-email" role="alert" className="text-teja">
            {estado.error}
          </p>
        ) : (
          <p id="ayuda-email" className="text-[0.95rem] text-pizarra">
            Te enviamos un enlace para entrar. Sin contraseñas.
          </p>
        )}
        <Boton type="submit" ancho disabled={enviando}>
          {enviando ? "Enviando…" : "Enviarme el enlace"}
        </Boton>
      </form>

      <div className="flex items-center gap-3 text-[0.95rem] text-pizarra" aria-hidden="true">
        <span className="h-px flex-1 bg-filete" /> o <span className="h-px flex-1 bg-filete" />
      </div>

      <form action={entrarConGoogle}>
        <input type="hidden" name="siguiente" value={siguiente} />
        <Boton type="submit" variante="secundario" ancho>
          Continuar con Google
        </Boton>
      </form>
    </div>
  );
}
