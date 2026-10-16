import { tocarAcceso } from "@/lib/crm/eventos";

/** Cualquier visita con sesión actualiza el último acceso, como mucho cada 10 minutos. */
export default async function LayoutApp({ children }: LayoutProps<"/app">) {
  await tocarAcceso();
  return children;
}
