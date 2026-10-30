"use client";

import { Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Estado =
  | "revisando"
  | "listo"
  | "pidiendo"
  | "suscrito"
  | "denegado"
  | "no-soportado"
  | "ios-instalar"
  | "sin-config"
  | "error";

const LLAVE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const EVENTO = "avisos-cambio";

function aBytes(base64: string) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
}

export function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function esInstalada() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

const MENSAJES: Partial<Record<Estado, string>> = {
  suscrito: "✓ Avisos activados en este dispositivo. Te llegará uno cada mañana a las 6:00.",
  denegado: "Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio.",
  "no-soportado": "Este navegador no permite notificaciones. Prueba con Chrome, Edge, Firefox o Safari.",
  "ios-instalar": "En iPhone, primero agrega la app a tu pantalla de inicio (Compartir → Agregar a inicio) y ábrela desde ahí.",
  "sin-config": "Las notificaciones estarán disponibles muy pronto.",
  error: "No se pudo activar. Revisa tu conexión e inténtalo de nuevo.",
};

export function BotonAvisos({ variante = "sol", compacto = false }: { variante?: "sol" | "oscuro"; compacto?: boolean }) {
  const [estado, setEstado] = useState<Estado>("revisando");
  const [detalle, setDetalle] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelado = false;
    const revisar = async () => {
      let siguiente: Estado = "listo";
      if (!LLAVE) siguiente = "sin-config";
      else if (esIOS() && !esInstalada()) siguiente = "ios-instalar";
      else if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window))
        siguiente = "no-soportado";
      else if (Notification.permission === "denied") siguiente = "denegado";
      else {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && (await reg.pushManager.getSubscription())) siguiente = "suscrito";
      }
      if (!cancelado) setEstado(siguiente);
    };
    revisar();
    // Todos los botones (el de la sección y el de la barra de abajo) se enteran del cambio.
    window.addEventListener(EVENTO, revisar);
    return () => {
      cancelado = true;
      window.removeEventListener(EVENTO, revisar);
    };
  }, []);

  async function activar() {
    setEstado("pidiendo");
    let paso = "permiso";
    try {
      // En iPhone el permiso debe pedirse directo desde el toque, antes de cualquier otra espera.
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "denegado" : "listo");
        return;
      }
      paso = "service-worker";
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      const listo = await navigator.serviceWorker.ready;
      paso = "suscribir";
      const existente = await listo.pushManager.getSubscription();
      const sub =
        existente ?? (await (listo ?? reg).pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(LLAVE) }));
      paso = "guardar";
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error(`servidor ${res.status}`);
      setEstado("suscrito");
      window.dispatchEvent(new Event(EVENTO));
      router.push("/suscrito");
    } catch (e) {
      const detalle = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      setDetalle(`${paso} · ${detalle}`);
      setEstado("error");
      fetch("/api/push/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paso, error: detalle, permiso: Notification.permission, instalada: esInstalada() }),
      }).catch(() => {});
    }
  }

  async function desactivar() {
    setEstado("pidiendo");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEstado("listo");
      window.dispatchEvent(new Event(EVENTO));
    } catch {
      setEstado("error");
    }
  }

  const clase = `boton boton-${variante}${compacto ? " boton-chico" : ""}`;
  const cargando = estado === "revisando" || estado === "pidiendo";
  const mensaje = MENSAJES[estado];

  if (compacto) {
    if (estado === "suscrito") return null;
    return (
      <Link className={clase} href="/avisos">
        <Campana /> Avisos 6:00
      </Link>
    );
  }

  return (
    <div>
      {estado === "suscrito" ? (
        <button
          type="button"
          className={`boton ${variante === "oscuro" ? "boton-contorno" : "boton-fantasma"}`}
          onClick={() => {
            if (window.confirm("¿Desactivar el aviso de las 6:00 en este dispositivo?")) desactivar();
          }}
        >
          <BellOff size={18} aria-hidden="true" /> Desactivar avisos
        </button>
      ) : (
        <button
          type="button"
          className={clase}
          onClick={activar}
          disabled={cargando || ["denegado", "no-soportado", "ios-instalar", "sin-config"].includes(estado)}
          aria-busy={cargando}
        >
          {cargando ? <span className="girando" aria-hidden="true" /> : <Campana />}
          {estado === "pidiendo" ? "Activando…" : "Recibir avisos a las 6:00"}
        </button>
      )}
      <p className={`estado-avisos ${estado === "suscrito" ? "ok" : ""} ${estado === "error" || estado === "denegado" ? "error" : ""}`} role="status">
        {mensaje ?? ""}
        {estado === "error" && detalle && <small style={{ display: "block", opacity: 0.7 }}>({detalle})</small>}
      </p>
    </div>
  );
}

function Campana() {
  return <Bell size={18} strokeWidth={2.2} aria-hidden="true" />;
}
