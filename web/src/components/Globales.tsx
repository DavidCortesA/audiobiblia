"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { BotonAvisos } from "./BotonAvisos";

const ENLACES = [
  ["/biblia", "Biblia", "La Biblia en un año"],
  ["/proverbios", "Proverbios", "Un capítulo cada día"],
  ["/ninos", "Niños", "Historias para los pequeños"],
] as const;

export function Encabezado() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [rutaAbierta, setRutaAbierta] = useState(ruta);

  // Al cambiar de página se cierra el menú.
  if (abierto && rutaAbierta !== ruta) setAbierto(false);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <header className={`encabezado${abierto ? " menu-abierto" : ""}`}>
      <div className="contenedor encabezado-fila">
        <Link href="/" className="encabezado-logo" aria-label="Audio Biblia, inicio">
          <Image src="/img/logo-blanco.png" alt="Audio Biblia — Castillo del Rey, A.R., Monterrey, México" width={900} height={265} priority style={{ height: "auto" }} />
        </Link>
        <nav aria-label="Series" className="nav-escritorio">
          {ENLACES.map(([href, texto]) => (
            <Link key={href} href={href} aria-current={ruta.startsWith(href) ? "page" : undefined}>
              {texto}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="boton-menu"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => {
            setRutaAbierta(ruta);
            setAbierto((a) => !a);
          }}
        >
          <span />
          <span />
        </button>
      </div>
      <AnimatePresence>
        {abierto && (
          <motion.nav
            id="menu-movil"
            className="menu-movil"
            aria-label="Menú"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.ul
              initial="oculto"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } }}
            >
              {[["/", "Inicio", "Los audios de hoy"] as const, ...ENLACES].map(([href, texto, sub]) => (
                <motion.li
                  key={href}
                  variants={{ oculto: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}
                >
                  <Link href={href} onClick={() => setAbierto(false)} aria-current={ruta === href ? "page" : undefined}>
                    <span className="menu-titulo">{texto}</span>
                    <span className="menu-sub">{sub}</span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
            <div className="menu-pie">
              <Link href="/#app" onClick={() => setAbierto(false)} className="boton boton-sol">
                Instalar la app y recibir avisos
              </Link>
              <p>
                <Link href="/privacidad" onClick={() => setAbierto(false)}>Privacidad</Link> ·{" "}
                <Link href="/terminos" onClick={() => setAbierto(false)}>Términos</Link>
              </p>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
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
