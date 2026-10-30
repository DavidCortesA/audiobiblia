"use client";

import { Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fechaCorta } from "@/lib/fechas";
import { SERIES, type Serie } from "@/lib/sitio";
import { MarcaEscuchado } from "./Progreso";

interface Entrada {
  s: string;
  e: Serie;
  l: string;
  f: string;
  d: number;
  m: string;
}

const SUGERENCIAS = ["Salmo 23", "Juan 3", "Génesis 1", "Proverbios 3", "David", "Jonás", "Daniel"];

/** Minúsculas, sin acentos, "salmo" = "salmos". */
function normalizar(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\bsalmo\b/g, "salmos")
    .replace(/[^a-z0-9ñ:]+/g, " ")
    .trim();
}

function palabras(t: string) {
  return new Set(normalizar(t).replace(/:/g, " ").split(" ").filter(Boolean));
}

export function Buscador() {
  const [indice, setIndice] = useState<Entrada[] | null>(null);
  const [error, setError] = useState(false);
  const [texto, setTexto] = useState("");

  useEffect(() => {
    // Si se llegó con ?q=, se usa como búsqueda inicial cuando el índice termina de cargar.
    const inicial = new URLSearchParams(window.location.search).get("q");
    fetch("/api/indice")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((datos: Entrada[]) => {
        setIndice(datos);
        if (inicial) setTexto((actual) => actual || inicial);
      })
      .catch(() => setError(true));
  }, []);

  const resultados = useMemo(() => {
    const consulta = normalizar(texto);
    if (!indice || consulta.length < 2) return [];
    const frase = new RegExp(`(^|\\s)${consulta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[\\s:])`);
    const tokens = consulta.replace(/:/g, " ").split(" ").filter(Boolean);
    const puntuados = indice.flatMap((e) => {
      const base = normalizar(`${e.l} ${SERIES[e.e].nombre}`);
      if (frase.test(base)) return [{ e, puntos: 2 }];
      const suyas = palabras(`${e.l} ${SERIES[e.e].nombre}`);
      // Números exactos ("3" no encuentra "13"); palabras por inicio ("dav" encuentra "David").
      const todas = tokens.every((t) => (/^\d+$/.test(t) ? suyas.has(t) : [...suyas].some((p) => p.startsWith(t))));
      return todas ? [{ e, puntos: 1 }] : [];
    });
    return puntuados.sort((a, b) => b.puntos - a.puntos || b.e.f.localeCompare(a.e.f)).slice(0, 60).map((x) => x.e);
  }, [indice, texto]);

  function cambiar(valor: string) {
    setTexto(valor);
    const url = new URL(window.location.href);
    if (valor) url.searchParams.set("q", valor);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="buscador">
      <label className="buscador-caja">
        <Search size={22} aria-hidden="true" />
        <span className="solo-lectores">Buscar</span>
        <input
          type="search"
          value={texto}
          onChange={(e) => cambiar(e.target.value)}
          placeholder="Libro, capítulo o historia… (ej. Juan 3, David)"
          autoFocus
          enterKeyHint="search"
          autoComplete="off"
        />
        {texto && (
          <button type="button" onClick={() => cambiar("")} aria-label="Borrar búsqueda">
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </label>

      {!texto && (
        <div className="sugerencias">
          <span>Prueba con:</span>
          {SUGERENCIAS.map((s) => (
            <button key={s} type="button" className="opcion" onClick={() => cambiar(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="vacio">No se pudo cargar el buscador. Revisa tu conexión.</p>}
      {!indice && !error && texto && <p className="vacio" aria-busy="true">Buscando…</p>}

      {indice && normalizar(texto).length >= 2 && (
        <>
          <p className="buscador-cuenta" role="status">
            {resultados.length
              ? `${resultados.length}${resultados.length === 60 ? "+" : ""} ${resultados.length === 1 ? "resultado" : "resultados"}`
              : "Sin resultados. Prueba con otro libro o palabra."}
          </p>
          <ul className="lista-favoritos">
            {resultados.map((r) => (
              <li key={r.s}>
                <Link href={`/${r.e}/${r.s}`} className="favorito">
                  <span className="favorito-imagen">
                    <Image src={r.m} alt="" fill sizes="120px" />
                    <MarcaEscuchado slug={r.s} variante="tarjeta" />
                  </span>
                  <span>
                    <span className="tarjeta-fecha">
                      {fechaCorta(r.f)} · {SERIES[r.e].corto}
                      {r.e !== "proverbios" ? ` · Día ${r.d}` : ""}
                    </span>
                    <span className="favorito-titulo">{r.l}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
