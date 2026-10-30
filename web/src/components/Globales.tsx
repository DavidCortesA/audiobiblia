"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Baby, BookHeart, BookOpen, Menu, Play, ScrollText, Search, Settings, Sunrise, X } from "lucide-react";
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
          <Link href="/buscar" aria-current={ruta === "/buscar" ? "page" : undefined} aria-label="Buscar">
            <Search size={18} aria-hidden="true" />
          </Link>
        </nav>
        <Link href="/buscar" className="boton-icono solo-app" aria-label="Buscar">
          <Search size={22} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <Link href="/avisos" className="boton-icono boton-icono-2 solo-app" aria-label="Ajustes">
          <Settings size={22} strokeWidth={1.8} aria-hidden="true" />
        </Link>
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
          {abierto ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
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
              {[["/", "Inicio", "Los audios de hoy"] as const, ...ENLACES, ["/buscar", "Buscar", "Por libro, capítulo o historia"] as const, ["/favoritos", "Mi espacio", "Tu progreso y tus guardados"] as const, ["/avisos", "Ajustes", "Avisos, modo oscuro y tamaño de letra"] as const].map(([href, texto, sub]) => (
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
                Ajustes y avisos
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
        <Play size={16} fill="currentColor" aria-hidden="true" /> Escuchar hoy
      </Link>
      <BotonAvisos compacto />
    </div>
  );
}

const PESTANAS = [
  { href: "/", texto: "Hoy", Icono: Sunrise },
  { href: "/biblia", texto: "Biblia", Icono: BookOpen },
  { href: "/proverbios", texto: "Proverbios", Icono: ScrollText },
  { href: "/ninos", texto: "Niños", Icono: Baby },
  { href: "/favoritos", texto: "Mi espacio", Icono: BookHeart },
];

/** Barra de pestañas de abajo: solo se ve cuando el sitio está instalado como app. */
export function BarraApp() {
  const ruta = usePathname();
  return (
    <nav className="barra-app" aria-label="Secciones">
      {PESTANAS.map(({ href, texto, Icono }) => {
        const activa = href === "/" ? ruta === "/" : ruta.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={activa ? "page" : undefined}>
            {activa && <motion.span layoutId="pestana-activa" className="pestana-fondo" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} />}
            <Icono size={22} strokeWidth={1.8} aria-hidden="true" />
            <span>{texto}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function RegistrarServiceWorker() {
  // Segunda revisión del modo app ya con la página cargada (por si el script inicial no alcanzó).
  useEffect(() => {
    const consulta = window.matchMedia("(display-mode: standalone)");
    const aplicar = () => {
      const app = consulta.matches || (navigator as { standalone?: boolean }).standalone === true;
      if (app) document.documentElement.setAttribute("data-modo", "app");
    };
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);
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
