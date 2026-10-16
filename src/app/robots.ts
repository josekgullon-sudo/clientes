import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app", "/admin", "/api", "/auth", "/entrar", "/suscripcion", "/demo", "/vista", "/baja"] },
    sitemap: `${SITIO.url}/sitemap.xml`,
  };
}
