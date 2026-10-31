import type { Metadata, Viewport } from "next";
import { Josefin_Sans, Literata } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AvisoAppIOS, AvisoCookies, BarraApp, BarraMovil, Encabezado, RegistrarServiceWorker } from "@/components/Globales";
import { ProveedorMovimiento } from "@/components/Movimiento";
import { Pie } from "@/components/Piezas";
import { SITIO } from "@/lib/sitio";
import "./globals.css";

const josefin = Josefin_Sans({ variable: "--font-josefin", subsets: ["latin"], weight: ["600", "700"], display: "swap" });
const literata = Literata({ variable: "--font-literata", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITIO.url),
  title: {
    default: `${SITIO.nombre}: la Biblia en audio cada día — Proverbios y Biblia para niños`,
    template: `%s · ${SITIO.nombre}`,
  },
  description: SITIO.descripcion,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  category: "religion",
  authors: [{ name: SITIO.iglesia }],
  creator: SITIO.iglesia,
  publisher: SITIO.iglesia,
  applicationName: SITIO.nombre,
  keywords: ["audio biblia", "biblia en audio", "proverbios del día", "biblia para niños", "devocional diario", "Castillo del Rey", "Monterrey"],
  openGraph: { type: "website", locale: "es_MX", siteName: SITIO.nombreLargo },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: SITIO.nombre, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e1a13",
  colorScheme: "light",
  viewportFit: "cover",
};

// Atributos propios (no clase): React no los reescribe al hidratar <html>. También aplica
// el tema y el tamaño de letra guardados, antes de pintar, para que no parpadee.
const DETECTAR_APP = `try{var d=document.documentElement;if(matchMedia("(display-mode: standalone)").matches||navigator.standalone===true)d.setAttribute("data-modo","app");var t=localStorage.getItem("tema"),l=localStorage.getItem("letra");if(t)d.setAttribute("data-tema",t);if(l)d.setAttribute("data-letra",l)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${josefin.variable} ${literata.variable}`} suppressHydrationWarning>
      <head>
        {/* Antes de pintar: si se abrió como app instalada, activa el modo app (sin parpadeo). */}
        <script dangerouslySetInnerHTML={{ __html: DETECTAR_APP }} />
      </head>
      <body>
        <ProveedorMovimiento>
          <a className="solo-lectores" href="#contenido">
            Saltar al contenido
          </a>
          <Encabezado />
          <main id="contenido">{children}</main>
          <Pie />
          <BarraMovil />
          <BarraApp />
          <AvisoCookies />
          <AvisoAppIOS />
        </ProveedorMovimiento>
        <RegistrarServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
