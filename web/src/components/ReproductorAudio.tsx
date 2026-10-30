"use client";

import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { SERIES, SITIO, type Serie } from "@/lib/sitio";

export interface PistaAudio {
  slug: string;
  serie: Serie;
  titulo: string;
  lectura: string;
  miniatura: string;
  audio: string;
}

const VELOCIDADES = [1, 1.25, 1.5, 0.85];
const LLAVE_VELOCIDAD = "velocidad-audio";

function formato(segundos: number) {
  if (!Number.isFinite(segundos)) return "0:00";
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function leer(llave: string) {
  try {
    return localStorage.getItem(llave);
  } catch {
    return null;
  }
}

function escribir(llave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(llave);
    else localStorage.setItem(llave, valor);
  } catch {}
}

/**
 * Reproductor de solo audio: sigue sonando con la pantalla bloqueada y muestra controles en
 * la pantalla de bloqueo (Media Session). Un solo <audio> para que, al terminar una pista,
 * la siguiente pueda empezar sola aunque el celular esté bloqueado.
 */
export function ReproductorAudio({
  pista,
  autoReproducir = false,
  alTerminar,
  alSiguiente,
  alAnterior,
}: {
  pista: PistaAudio;
  autoReproducir?: boolean;
  alTerminar?: () => void;
  alSiguiente?: () => void;
  alAnterior?: () => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [sonando, setSonando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [velocidad, setVelocidad] = useState(1);
  const [error, setError] = useState(false);
  const ultimoGuardado = useRef(0);

  const llavePosicion = `posicion:${pista.slug}`;

  // Cambiar de pista: mismo elemento <audio>, nueva fuente.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    setError(false);
    setTiempo(0);
    setDuracion(0);
    el.src = pista.audio;
    el.load();
    const guardada = Number(leer(`posicion:${pista.slug}`) ?? 0);
    const alListo = () => {
      if (guardada > 5 && guardada < el.duration - 10) el.currentTime = guardada;
      el.playbackRate = Number(leer(LLAVE_VELOCIDAD) ?? 1) || 1;
      setVelocidad(el.playbackRate);
    };
    el.addEventListener("loadedmetadata", alListo, { once: true });
    if (autoReproducir) el.play().catch(() => setSonando(false));
    return () => el.removeEventListener("loadedmetadata", alListo);
  }, [pista.audio, pista.slug, autoReproducir]);

  const alternar = useCallback(() => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => setError(true));
    else el.pause();
  }, []);

  const mover = useCallback((segundos: number) => {
    const el = audio.current;
    if (el) el.currentTime = Math.min(Math.max(0, el.currentTime + segundos), el.duration || Infinity);
  }, []);

  // Pantalla de bloqueo / audífonos / CarPlay.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: pista.lectura,
      artist: SERIES[pista.serie].nombre,
      album: `${SITIO.nombre} · ${SITIO.iglesia}`,
      artwork: [
        { src: pista.miniatura, sizes: "480x360", type: "image/jpeg" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
    const acciones: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ["play", () => audio.current?.play()],
      ["pause", () => audio.current?.pause()],
      ["seekbackward", (d) => mover(-(d.seekOffset ?? 15))],
      ["seekforward", (d) => mover(d.seekOffset ?? 15)],
      ["seekto", (d) => {
        if (audio.current && d.seekTime != null) audio.current.currentTime = d.seekTime;
      }],
      ["nexttrack", alSiguiente ?? null],
      ["previoustrack", alAnterior ?? null],
    ];
    for (const [accion, fn] of acciones) {
      try {
        navigator.mediaSession.setActionHandler(accion, fn);
      } catch {}
    }
  }, [pista, mover, alSiguiente, alAnterior]);

  useEffect(() => {
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = sonando ? "playing" : "paused";
  }, [sonando]);

  function alAvanzar() {
    const el = audio.current;
    if (!el) return;
    setTiempo(el.currentTime);
    // Guarda dónde vas cada 5 s para continuar después.
    if (Math.abs(el.currentTime - ultimoGuardado.current) > 5) {
      ultimoGuardado.current = el.currentTime;
      escribir(llavePosicion, String(Math.floor(el.currentTime)));
      if ("mediaSession" in navigator && el.duration) {
        try {
          navigator.mediaSession.setPositionState({ duration: el.duration, position: el.currentTime, playbackRate: el.playbackRate });
        } catch {}
      }
    }
  }

  function cambiarVelocidad() {
    const el = audio.current;
    const siguiente = VELOCIDADES[(VELOCIDADES.indexOf(velocidad) + 1) % VELOCIDADES.length];
    if (el) el.playbackRate = siguiente;
    setVelocidad(siguiente);
    escribir(LLAVE_VELOCIDAD, String(siguiente));
  }

  const progreso = duracion ? (tiempo / duracion) * 100 : 0;

  return (
    <div className="audio">
      <Image className="audio-fondo" src={pista.miniatura} alt="" fill sizes="(max-width: 760px) 100vw, 760px" />
      <audio
        ref={audio}
        preload="metadata"
        playsInline
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onWaiting={() => setCargando(true)}
        onPlaying={() => setCargando(false)}
        onCanPlay={() => setCargando(false)}
        onLoadedMetadata={(e) => setDuracion(e.currentTarget.duration)}
        onTimeUpdate={alAvanzar}
        onError={() => setError(true)}
        onEnded={() => {
          escribir(llavePosicion, null);
          setSonando(false);
          alTerminar?.();
        }}
      />
      <div className="audio-controles">
        <span className="audio-serie">{SERIES[pista.serie].nombre}</span>
        <span className="audio-lectura">{pista.lectura}</span>
        <div className="audio-botones">
          <button type="button" className="audio-saltar" onClick={() => mover(-15)} aria-label="Regresar 15 segundos">
            <RotateCcw size={22} aria-hidden="true" />
            <small>15</small>
          </button>
          <button
            type="button"
            className="audio-play"
            onClick={alternar}
            aria-label={sonando ? "Pausar" : "Escuchar"}
            aria-busy={cargando}
          >
            {cargando ? <span className="girando" aria-hidden="true" /> : sonando ? <Pause size={34} fill="currentColor" /> : <Play size={34} fill="currentColor" style={{ marginLeft: 4 }} />}
          </button>
          <button type="button" className="audio-saltar" onClick={() => mover(15)} aria-label="Adelantar 15 segundos">
            <RotateCw size={22} aria-hidden="true" />
            <small>15</small>
          </button>
        </div>
        <div className="audio-barra">
          <span>{formato(tiempo)}</span>
          <input
            type="range"
            min={0}
            max={duracion || 0}
            step={1}
            value={tiempo}
            onChange={(e) => {
              if (audio.current) audio.current.currentTime = Number(e.target.value);
              setTiempo(Number(e.target.value));
            }}
            aria-label="Posición del audio"
            style={{ ["--progreso" as string]: `${progreso}%` }}
          />
          <span>{formato(duracion)}</span>
          <button type="button" className="audio-velocidad" onClick={cambiarVelocidad} aria-label={`Velocidad ${velocidad}x`}>
            {velocidad}×
          </button>
        </div>
        {error && <span className="audio-error">No se pudo cargar el audio. Prueba con YouTube.</span>}
      </div>
    </div>
  );
}
