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
              {[["/", "Inicio", "Los audios de hoy"] as const, ...ENLACES, ["/avisos", "Avisos", "Activar o desactivar las notificaciones"] as const].map(([href, texto, sub]) => (
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
              <Link href="/avisos" onClick={() => setAbierto(false)} className="boton boton-sol">
                Avisos y app
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

const PESTANAS = [
  { href: "/", texto: "Hoy", icono: <path d="M12 3v2M5.6 5.6 7 7M3 12h2M19 12h2M17 7l1.4-1.4M7 17a5 5 0 1 1 10 0M3 21h18" /> },
  { href: "/biblia", texto: "Biblia", icono: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21a2 2 0 0 1 2-2h13M9 7h6" /> },
  { href: "/proverbios", texto: "Proverbios", icono: <path d="M4 4h16v16H4zM4 9h16M9 4v5M8 13h3M8 16h6" /> },
  { href: "/ninos", texto: "Niños", icono: <path d="M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 22v-5l-2-4 4-2h8l4 2-2 4v5M9 22v-4h6v4" /> },
  {
    href: "/avisos",
    texto: "Avisos",
    icono: <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />,
  },
];

/** Barra de pestañas de abajo: solo se ve cuando el sitio está instalado como app. */
export function BarraApp() {
  const ruta = usePathname();
  return (
    <nav className="barra-app" aria-label="Secciones">
      {PESTANAS.map(({ href, texto, icono }) => {
        const activa = href === "/" ? ruta === "/" : ruta.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={activa ? "page" : undefined}>
            {activa && <motion.span layoutId="pestana-activa" className="pestana-fondo" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} />}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {icono}
            </svg>
            <span>{texto}</span>
          </Link>
        );
      })}
    </nav>
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
