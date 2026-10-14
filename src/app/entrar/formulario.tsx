"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";
import { Boton } from "@/components/boton";
import { evento } from "@/components/evento";
import { enviarEnlace, entrarConGoogle, verificarCodigo, type EstadoCodigo, type EstadoEntrar } from "./acciones";

export function FormularioEntrar({ siguiente, registro }: { siguiente: string; registro: boolean }) {
  const [estado, accion, enviando] = useActionState<EstadoEntrar, FormData>(enviarEnlace, {});

  return (
    <div className="flex flex-col gap-6">
      <form action={entrarConGoogle}>
        <input type="hidden" name="siguiente" value={siguiente} />
        <Boton type="submit" variante="secundario" ancho onClick={() => evento(registro ? "signup" : "login", { metodo: "google" })}>
          <LogoGoogle /> Continuar con Google
        </Boton>
      </form>

      <div className="flex items-center gap-3 text-sm font-semibold text-pizarra" aria-hidden="true">
        <span className="h-px flex-1 bg-filete" /> o con tu correo <span className="h-px flex-1 bg-filete" />
      </div>

      {estado.enviado ? (
        <Codigo siguiente={siguiente} email={estado.enviado} />
      ) : (
        <form action={accion} className="flex flex-col gap-3" noValidate>
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
            className="min-h-14 rounded-xl border border-filete bg-papel px-4 text-[1.0625rem] transition placeholder:text-pizarra/70 focus:border-pino"
            placeholder="nombre@correo.es"
          />
          {estado.error ? (
            <p id="error-email" role="alert" className="text-teja">{estado.error}</p>
          ) : (
            <p id="ayuda-email" className="text-sm text-pizarra">
              Te enviamos un código por correo. Sin contraseñas.
            </p>
          )}
          <Boton
            type="submit"
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
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="siguiente" value={siguiente} />
      <input type="hidden" name="email" value={email} />
      <div role="status" className="rounded-2xl bg-pino-suave p-4">
        <p className="flex items-center gap-2 font-bold text-pino">
          <MailCheck aria-hidden size={20} /> Revisa tu correo
        </p>
        <p className="mt-1 text-[0.95rem]">
          Hemos enviado un código a <strong>{email}</strong>. También puedes abrir el enlace del correo en este dispositivo.
        </p>
      </div>
      <label htmlFor="codigo" className="font-semibold">Código del correo</label>
      <input
        id="codigo"
        name="codigo"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6,10}"
        maxLength={10}
        required
        aria-invalid={!!estado.error}
        className="cifras min-h-16 rounded-xl border border-filete bg-papel px-4 text-center text-3xl font-extrabold tracking-[0.3em] focus:border-pino"
        placeholder="Código"
      />
      {estado.error && (
        <p role="alert" className="text-teja">{estado.error}</p>
      )}
      <Boton type="submit" ancho disabled={enviando}>
        {enviando ? "Comprobando…" : "Entrar con el código"}
      </Boton>
      <p className="text-sm text-pizarra">Si no llega en un par de minutos, mira en la carpeta de spam.</p>
    </form>
  );
}

function LogoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}
