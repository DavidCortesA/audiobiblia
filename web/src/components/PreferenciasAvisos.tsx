"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { LISTA_SERIES, SERIES, type Serie } from "@/lib/sitio";

const HORAS = [6, 7, 8] as const;
const LLAVE = "prefs-avisos";

interface Prefs {
  series: Serie[];
  hora: (typeof HORAS)[number];
}

function leerPrefs(): Prefs {
  try {
    return { series: [...LISTA_SERIES], hora: 6, ...JSON.parse(localStorage.getItem(LLAVE) ?? "{}") };
  } catch {
    return { series: [...LISTA_SERIES], hora: 6 };
  }
}

/** Qué series y a qué hora: solo aparece si este dispositivo tiene los avisos activados. */
export function PreferenciasAvisos() {
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [estado, setEstado] = useState<"" | "guardando" | "ok" | "error">("");

  useEffect(() => {
    const revisar = async () => {
      const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
      const sub = await reg?.pushManager?.getSubscription();
      setEndpoint(sub?.endpoint ?? null);
      setPrefs(leerPrefs());
    };
    revisar();
    window.addEventListener("avisos-cambio", revisar);
    return () => window.removeEventListener("avisos-cambio", revisar);
  }, []);

  async function guardar(nuevas: Prefs) {
    if (!endpoint || !nuevas.series.length) return;
    setPrefs(nuevas);
    setEstado("guardando");
    try {
      const res = await fetch("/api/push/preferencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, ...nuevas }),
      });
      if (!res.ok) throw new Error(String(res.status));
      localStorage.setItem(LLAVE, JSON.stringify(nuevas));
      setEstado("ok");
      window.setTimeout(() => setEstado(""), 1800);
    } catch {
      setEstado("error");
    }
  }

  if (!endpoint || !prefs) return null;

  return (
    <div className="preferencias">
      <fieldset>
        <legend>¿De qué quieres el aviso?</legend>
        <div className="opciones">
          {LISTA_SERIES.map((s) => {
            const activa = prefs.series.includes(s);
            const ultima = activa && prefs.series.length === 1;
            return (
              <label key={s} className={`opcion${activa ? " opcion-activa" : ""}`} title={ultima ? "Deja al menos una" : undefined}>
                <input
                  type="checkbox"
                  checked={activa}
                  disabled={ultima}
                  onChange={() => guardar({ ...prefs, series: activa ? prefs.series.filter((x) => x !== s) : [...prefs.series, s] })}
                />
                {activa && <Check size={16} aria-hidden="true" />}
                {SERIES[s].corto}
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>¿A qué hora?</legend>
        <div className="opciones">
          {HORAS.map((h) => (
            <label key={h} className={`opcion${prefs.hora === h ? " opcion-activa" : ""}`}>
              <input type="radio" name="hora-aviso" checked={prefs.hora === h} onChange={() => guardar({ ...prefs, hora: h })} />
              {h}:00 a.m.
            </label>
          ))}
        </div>
        <p className="preferencias-nota">El aviso llega durante esa hora (por ejemplo, entre 7:00 y 7:59).</p>
      </fieldset>
      <p className="preferencias-estado" role="status">
        {estado === "guardando" && "Guardando…"}
        {estado === "ok" && "✓ Guardado"}
        {estado === "error" && "No se pudo guardar. Revisa tu conexión."}
      </p>
    </div>
  );
}
