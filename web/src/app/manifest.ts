import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

export default function manifest(): MetadataRoute.Manifest {
  // Android: los enlaces del sitio (p. ej. desde WhatsApp) se abren en la app instalada, en la ventana que ya
  // está abierta. handle_links aún no está en los tipos de Next.
  const enlaces = { handle_links: "preferred" } as Partial<MetadataRoute.Manifest>;
  return {
    ...enlaces,
    id: "/",
    name: SITIO.nombreLargo,
    short_name: SITIO.nombre,
    description: SITIO.descripcion,
    lang: "es-MX",
    start_url: "/",
    scope: "/",
    display: "standalone",
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    orientation: "portrait",
    background_color: "#0e1a13",
    theme_color: "#0e1a13",
    categories: ["books", "education", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Audio Biblia", url: "/biblia", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Proverbios", url: "/proverbios", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Niños", url: "/ninos", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
