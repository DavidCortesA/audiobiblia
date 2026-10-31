import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Tipografías e imágenes que lee el generador de imágenes de cada audio.
  outputFileTracingIncludes: {
    "/[serie]/[slug]": ["./data/rv1909/*.json"],
    "/reflexiones/[slug]": ["./data/rv1909/*.json"],
    "/[serie]/[slug]/**": ["./data/rv1909/*.json", "./assets/fonts/*.woff", "./public/img/amanecer-1200.jpg", "./public/img/logo-blanco.png", "./public/img/ninos-portada.jpg", "./public/img/proverbios-fondo.jpg"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      // Portadas de las reflexiones (copias en Vercel Blob)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/reflexiones/**" },
    ],
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
