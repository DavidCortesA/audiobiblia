"use client";

import { Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fechaCorta } from "@/lib/fechas";
import { REFLEXIONES, SERIES, type Serie } from "@/lib/sitio";
import { MarcaEscuchado } from "./Progreso";

interface Entrada {
  s: string;
  e: Serie | "reflexiones";
  l: string;
  t?: string; // texto del versículo (reflexiones)
  f: string;
  d: number;
  m: string;
}

const SIN_FRAGMENTOS: Record<string, string> = {};

const SUGERENCIAS = ["Salmo 23", "Juan 3", "Génesis 1", "Proverbios 3", "David", "Jonás", "Daniel"];

const nombreDe = (e: Entrada) => (e.e === "reflexiones" ? `${REFLEXIONES.nombre} reflexion ${e.t ?? ""}` : SERIES[e.e].nombre);
const cortoDe = (e: Entrada) => (e.e === "reflexiones" ? "Reflexión" : SERIES[e.e].corto);

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
  // Coincidencias dentro de las historias de Niños (las busca el servidor): {consulta, slug → fragmento}.
  const [enHistorias, setEnHistorias] = useState<{ consulta: string; fragmentos: Record<string, string> } | null>(null);

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

  useEffect(() => {
    const consulta = texto.trim();
    if (consulta.length < 3) return;
    const control = new AbortController();
    const espera = window.setTimeout(() => {
      fetch(`/api/historias?q=${encodeURIComponent(consulta)}`, { signal: control.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((lista: { s: string; fragmento: string }[]) =>
          setEnHistorias({ consulta, fragmentos: Object.fromEntries(lista.map((x) => [x.s, x.fragmento])) }),
        )
        .catch(() => {});
    }, 350);
    return () => {
      window.clearTimeout(espera);
      control.abort();
    };
  }, [texto]);
  const fragmentos = useMemo(
    () => (enHistorias?.consulta === texto.trim() ? enHistorias.fragmentos : SIN_FRAGMENTOS),
    [enHistorias, texto],
  );

  const resultados = useMemo(() => {
    const consulta = normalizar(texto);
    if (!indice || consulta.length < 2) return [];
    const frase = new RegExp(`(^|\\s)${consulta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[\\s:])`);
    const tokens = consulta.replace(/:/g, " ").split(" ").filter(Boolean);
    const puntuados = indice.flatMap((e) => {
      const base = normalizar(`${e.l} ${nombreDe(e)}`);
      if (frase.test(base)) return [{ e, puntos: 2 }];
      const suyas = palabras(`${e.l} ${nombreDe(e)}`);
      // Números exactos ("3" no encuentra "13"); palabras por inicio ("dav" encuentra "David").
      const todas = tokens.every((t) => (/^\d+$/.test(t) ? suyas.has(t) : [...suyas].some((p) => p.startsWith(t))));
      return todas ? [{ e, puntos: 1 }] : [];
    });
    // Luego, las historias de Niños que mencionan la búsqueda en su texto.
    const ya = new Set(puntuados.map((x) => x.e.s));
    const deHistorias = indice.filter((e) => fragmentos[e.s] && !ya.has(e.s)).map((e) => ({ e, puntos: 0 }));
    return [...puntuados, ...deHistorias]
      .sort((a, b) => b.puntos - a.puntos || b.e.f.localeCompare(a.e.f))
      .slice(0, 60)
      .map((x) => x.e);
  }, [indice, texto, fragmentos]);

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
          placeholder="Libro, capítulo, historia o palabra… (ej. Juan 3, David)"
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
                      {fechaCorta(r.f)} · {cortoDe(r)}
                      {r.e === "biblia" || r.e === "ninos" ? ` · Día ${r.d}` : ""}
                    </span>
                    <span className="favorito-titulo">{r.l}</span>
                    {fragmentos[r.s] && <span className="buscador-fragmento">{fragmentos[r.s]}</span>}
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
