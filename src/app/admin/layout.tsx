import { notFound } from "next/navigation";
import { esAdmin } from "@/lib/admin/acceso";

export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  if (!(await esAdmin())) notFound();
  return children;
}
