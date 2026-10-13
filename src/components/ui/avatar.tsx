import { avatar } from "@/lib/estudio/perfil";

/** Avatar del perfil público: un animal sobre un círculo de color. */
export function Avatar({ clave, className = "size-11 text-2xl" }: { clave: string | null | undefined; className?: string }) {
  const a = avatar(clave);
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full border-2 border-black/5 leading-none ${className}`}
      style={{ background: a.fondo }}
    >
      {a.emoji}
    </span>
  );
}
