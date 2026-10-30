"use client";

import type { Serie } from "./sitio";

/** Favoritos guardados solo en este dispositivo (localStorage). */
export interface Favorito {
  slug: string;
  serie: Serie;
  titulo: string;
  lectura: string;
  miniatura: string;
  fecha: string;
  guardado: string; // ISO
}

const LLAVE = "favoritos-v1";
const EVENTO = "favoritos-cambio";

export function leerFavoritos(): Favorito[] {
  try {
    return JSON.parse(localStorage.getItem(LLAVE) ?? "[]") as Favorito[];
  } catch {
    return [];
  }
}

function guardar(lista: Favorito[]) {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(lista));
  } catch {}
  window.dispatchEvent(new Event(EVENTO));
}

export function esFavorito(slug: string) {
  return leerFavoritos().some((f) => f.slug === slug);
}

/** Agrega o quita; devuelve si quedó guardado. */
export function alternarFavorito(f: Omit<Favorito, "guardado">) {
  const lista = leerFavoritos();
  if (lista.some((x) => x.slug === f.slug)) {
    guardar(lista.filter((x) => x.slug !== f.slug));
    return false;
  }
  guardar([{ ...f, guardado: new Date().toISOString() }, ...lista]);
  return true;
}

export function quitarFavorito(slug: string) {
  guardar(leerFavoritos().filter((x) => x.slug !== slug));
}

/** Avisa cuando cambian (en esta pestaña u otra). */
export function escucharFavoritos(alCambiar: () => void) {
  const enStorage = (e: StorageEvent) => e.key === LLAVE && alCambiar();
  window.addEventListener(EVENTO, alCambiar);
  window.addEventListener("storage", enStorage);
  return () => {
    window.removeEventListener(EVENTO, alCambiar);
    window.removeEventListener("storage", enStorage);
  };
}
