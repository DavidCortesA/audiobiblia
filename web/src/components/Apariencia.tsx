"use client";

import { useEffect, useState } from "react";

const TEMAS = [
  ["claro", "Claro"],
  ["oscuro", "Oscuro"],
  ["auto", "Como mi celular"],
] as const;
const LETRAS = [
  ["normal", "Normal"],
  ["grande", "Grande"],
  ["muy-grande", "Muy grande"],
] as const;

type Tema = (typeof TEMAS)[number][0];
type Letra = (typeof LETRAS)[number][0];

function aplicar(llave: "tema" | "letra", valor: string, porDefecto: string) {
  const raiz = document.documentElement;
  try {
    if (valor === porDefecto) localStorage.removeItem(llave);
    else localStorage.setItem(llave, valor);
  } catch {}
  if (valor === porDefecto) raiz.removeAttribute(`data-${llave}`);
  else raiz.setAttribute(`data-${llave}`, valor);
}

/** Modo oscuro y tamaño de letra; se guardan en este dispositivo. */
export function Apariencia() {
  const [tema, setTema] = useState<Tema | null>(null);
  const [letra, setLetra] = useState<Letra | null>(null);

  useEffect(() => {
    const raiz = document.documentElement;
    const t = window.setTimeout(() => {
      setTema((raiz.getAttribute("data-tema") as Tema) ?? "claro");
      setLetra((raiz.getAttribute("data-letra") as Letra) ?? "normal");
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!tema || !letra) return null;

  return (
    <div className="preferencias" style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>
      <fieldset>
        <legend>Tema</legend>
        <div className="opciones">
          {TEMAS.map(([valor, texto]) => (
            <label key={valor} className={`opcion${tema === valor ? " opcion-activa" : ""}`}>
              <input type="radio" name="tema" checked={tema === valor} onChange={() => (setTema(valor), aplicar("tema", valor, "claro"))} />
              {texto}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Tamaño de letra</legend>
        <div className="opciones">
          {LETRAS.map(([valor, texto]) => (
            <label key={valor} className={`opcion${letra === valor ? " opcion-activa" : ""}`}>
              <input type="radio" name="letra" checked={letra === valor} onChange={() => (setLetra(valor), aplicar("letra", valor, "normal"))} />
              <span style={{ fontSize: valor === "normal" ? 14 : valor === "grande" ? 16 : 18 }}>{texto}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
