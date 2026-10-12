import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vista",
  robots: { index: false, follow: false },
};

/** Maquetas sin sesión para las capturas. No forman parte del producto. */
export default function LayoutVista({ children }: LayoutProps<"/vista">) {
  return children;
}
