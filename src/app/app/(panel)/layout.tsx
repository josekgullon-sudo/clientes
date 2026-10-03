import Link from "next/link";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { usuarioActual } from "@/lib/datos/usuario";

export default async function LayoutPanel({ children }: LayoutProps<"/app">) {
  await usuarioActual();
  return (
    <>
      <Cabecera
        derecha={
          <nav aria-label="Tu cuenta" className="flex items-center">
            <Link href="/app" className="inline-flex min-h-11 items-center px-2 font-semibold hover:underline">
              Panel
            </Link>
            <Link href="/app/cuenta" className="inline-flex min-h-11 items-center px-2 font-semibold hover:underline">
              Cuenta
            </Link>
          </nav>
        }
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-16">{children}</main>
      <Pie />
    </>
  );
}
