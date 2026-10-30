import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Tipografías e imágenes que lee el generador de imágenes de cada audio.
  outputFileTracingIncludes: {
    "/[serie]/[slug]/**": ["./assets/fonts/*.woff", "./public/img/amanecer-1200.jpg", "./public/img/logo-blanco.png", "./public/img/ninos-portada.jpg", "./public/img/proverbios-fondo.jpg"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
