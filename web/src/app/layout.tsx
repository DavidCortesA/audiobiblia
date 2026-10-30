import type { Metadata, Viewport } from "next";
import { Josefin_Sans, Literata } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AvisoCookies, BarraApp, BarraMovil, Encabezado, RegistrarServiceWorker } from "@/components/Globales";
import { ProveedorMovimiento } from "@/components/Movimiento";
import { Pie } from "@/components/Piezas";
import { SITIO } from "@/lib/sitio";
import "./globals.css";

const josefin = Josefin_Sans({ variable: "--font-josefin", subsets: ["latin"], weight: ["600", "700"], display: "swap" });
const literata = Literata({ variable: "--font-literata", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITIO.url),
  title: { default: `${SITIO.nombre} — La Palabra en cada amanecer`, template: `%s · ${SITIO.nombre}` },
  description: SITIO.descripcion,
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

// Atributo propio (no clase): React no lo reescribe al hidratar <html>.
const DETECTAR_APP = `try{if(matchMedia("(display-mode: standalone)").matches||navigator.standalone===true)document.documentElement.setAttribute("data-modo","app")}catch(e){}`;

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
        </ProveedorMovimiento>
        <RegistrarServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
