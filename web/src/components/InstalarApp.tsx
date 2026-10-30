"use client";

import { useEffect, useState } from "react";
import { esInstalada, esIOS } from "./BotonAvisos";

interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Botón "Instalar" en Android/Chrome; instrucciones en iPhone; nada si ya está instalada. */
export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [modo, setModo] = useState<"revisando" | "android" | "ios" | "instalada" | "otro">("revisando");

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (esInstalada()) setModo("instalada");
      else if (esIOS()) setModo("ios");
      else setModo((m) => (m === "revisando" ? "otro" : m));
    }, 0);
    const alPedir = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
      setModo("android");
    };
    window.addEventListener("beforeinstallprompt", alPedir);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", alPedir);
    };
  }, []);

  if (modo === "instalada") return <p className="estado-avisos ok">✓ Ya tienes la app instalada en este dispositivo.</p>;
  if (modo === "android" && evento)
    return (
      <button
        type="button"
        className="boton boton-fantasma"
        onClick={async () => {
          await evento.prompt();
          const { outcome } = await evento.userChoice;
          if (outcome === "accepted") setModo("instalada");
        }}
      >
        Instalar la app
      </button>
    );
  if (modo === "ios")
    return (
      <p className="estado-avisos">
        En iPhone: toca <b>Compartir</b> <span aria-hidden="true">⬆︎</span> y luego <b>Agregar a pantalla de inicio</b>.
      </p>
    );
  return (
    <p className="estado-avisos">
      Desde el menú del navegador elige <b>Instalar app</b> o <b>Agregar a pantalla de inicio</b>.
    </p>
  );
}
