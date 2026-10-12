"use client";

import { useActionState } from "react";
import { Boton } from "@/components/boton";
import { evento } from "@/components/evento";
import { enviarEnlace, entrarConGoogle, verificarCodigo, type EstadoCodigo, type EstadoEntrar } from "./acciones";

export function FormularioEntrar({ siguiente, registro }: { siguiente: string; registro: boolean }) {
  const [estado, accion, enviando] = useActionState<EstadoEntrar, FormData>(enviarEnlace, {});

  return (
    <div className="flex flex-col gap-6">
      <form action={entrarConGoogle} className="order-1 md:order-3">
        <input type="hidden" name="siguiente" value={siguiente} />
        <Boton type="submit" ancho onClick={() => evento(registro ? "signup" : "login", { metodo: "google" })}>
          Continuar con Google
        </Boton>
      </form>

      <div className="order-2 flex items-center gap-3 text-[0.95rem] text-pizarra md:order-2" aria-hidden="true">
        <span className="h-px flex-1 bg-filete" /> o <span className="h-px flex-1 bg-filete" />
      </div>

      {estado.enviado ? (
        <Codigo siguiente={siguiente} email={estado.enviado} />
      ) : (
        <form action={accion} className="order-3 flex flex-col gap-3 md:order-1" noValidate>
          <input type="hidden" name="siguiente" value={siguiente} />
          <label htmlFor="email" className="font-semibold">Tu correo</label>
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
            <p id="error-email" role="alert" className="text-teja">{estado.error}</p>
          ) : (
            <p id="ayuda-email" className="text-[0.95rem] text-pizarra">
              Te enviamos un código de 6 dígitos y un enlace. Sin contraseñas.
            </p>
          )}
          <Boton
            type="submit"
            variante="secundario"
            ancho
            disabled={enviando}
            onClick={() => evento(registro ? "signup" : "login", { metodo: "email" })}
          >
            {enviando ? "Enviando…" : "Enviarme el código"}
          </Boton>
        </form>
      )}
    </div>
  );
}

function Codigo({ siguiente, email }: { siguiente: string; email: string }) {
  const [estado, accion, enviando] = useActionState<EstadoCodigo, FormData>(verificarCodigo, { email });
  return (
    <form action={accion} className="order-3 flex flex-col gap-3 md:order-1">
      <input type="hidden" name="siguiente" value={siguiente} />
      <input type="hidden" name="email" value={email} />
      <div role="status" className="rounded-xl border border-filete bg-papel-hundido p-4">
        <p className="font-serif text-xl font-semibold">Introduce el código que te hemos enviado</p>
        <p className="mt-2">
          Está en el correo de <strong>{email}</strong>. También puedes abrir el enlace, en este dispositivo.
        </p>
      </div>
      <label htmlFor="codigo" className="font-semibold">Código de 6 dígitos</label>
      <input
        id="codigo"
        name="codigo"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        aria-invalid={!!estado.error}
        className="min-h-14 rounded-md border border-pizarra/70 bg-papel px-4 text-center font-serif text-2xl tracking-[0.4em]"
        placeholder="000000"
      />
      {estado.error && (
        <p role="alert" className="text-teja">{estado.error}</p>
      )}
      <Boton type="submit" ancho disabled={enviando}>
        {enviando ? "Comprobando…" : "Entrar con el código"}
      </Boton>
      <p className="text-[0.95rem] text-pizarra">Si no llega en unos minutos, mira en el spam.</p>
    </form>
  );
}
