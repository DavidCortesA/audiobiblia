"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BotonAvisos } from "./BotonAvisos";

export function Encabezado() {
  const ruta = usePathname();
  const enlaces = [
    ["/biblia", "Biblia"],
    ["/proverbios", "Proverbios"],
    ["/ninos", "Niños"],
  ] as const;
  return (
    <header className="encabezado">
      <div className="contenedor encabezado-fila">
        <Link href="/" className="encabezado-logo" aria-label="Audio Biblia, inicio">
          <Image src="/img/logo-blanco.png" alt="Audio Biblia — Castillo del Rey, A.R., Monterrey, México" width={900} height={265} priority style={{ height: "auto" }} />
        </Link>
        <nav aria-label="Series">
          {enlaces.map(([href, texto]) => (
            <Link key={href} href={href} aria-current={ruta.startsWith(href) ? "page" : undefined}>
              {texto}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function BarraMovil() {
  return (
    <div className="barra-movil">
      <Link className="boton boton-fantasma" href="/#hoy">
        ▶ Escuchar hoy
      </Link>
      <BotonAvisos compacto />
    </div>
  );
}

export function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

const LLAVE_COOKIES = "aviso-cookies-v1";

export function AvisoCookies() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        setVisible(!localStorage.getItem(LLAVE_COOKIES));
      } catch {
        setVisible(true);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div className="aviso-cookies" role="dialog" aria-label="Aviso de cookies">
      <p>
        Este sitio no usa cookies de rastreo. Los videos se cargan desde YouTube o Facebook solo cuando das play, y esos
        servicios pueden usar sus propias cookies. <Link href="/privacidad">Más información</Link>.
      </p>
      <button
        type="button"
        className="boton boton-oscuro boton-chico"
        onClick={() => {
          try {
            localStorage.setItem(LLAVE_COOKIES, "ok");
          } catch {}
          setVisible(false);
        }}
      >
        Entendido
      </button>
    </div>
  );
}
