import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/suscrito", "/avisos", "/favoritos"] },
    sitemap: `${SITIO.url}/sitemap.xml`,
  };
}
