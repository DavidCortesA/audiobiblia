"use client";

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
  suscrito: "✓ Recibirás un aviso cada mañana cuando salgan los audios.",
  denegado: "Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio.",
  "no-soportado": "Este navegador no permite notificaciones. Prueba con Chrome, Edge, Firefox o Safari.",
  "ios-instalar": "En iPhone, primero agrega la app a tu pantalla de inicio (Compartir → Agregar a inicio) y ábrela desde ahí.",
  "sin-config": "Las notificaciones estarán disponibles muy pronto.",
  error: "No se pudo activar. Revisa tu conexión e inténtalo de nuevo.",
};

export function BotonAvisos({ variante = "sol", compacto = false }: { variante?: "sol" | "oscuro"; compacto?: boolean }) {
  const [estado, setEstado] = useState<Estado>("revisando");
  const router = useRouter();

  useEffect(() => {
    let cancelado = false;
    (async () => {
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
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  async function activar() {
    setEstado("pidiendo");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "denegado" : "listo");
        return;
      }
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(LLAVE) });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error(String(res.status));
      setEstado("suscrito");
      router.push("/suscrito");
    } catch {
      setEstado("error");
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
      <Link className={clase} href="/#app">
        <Campana /> Avisos 6:00
      </Link>
    );
  }

  return (
    <div>
      {estado === "suscrito" ? (
        <button type="button" className="boton boton-fantasma" onClick={desactivar}>
          Desactivar avisos
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
      </p>
    </div>
  );
}

function Campana() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
