"use client";

import { fechaLocal, sumarDias } from "./fechas";
import type { Serie } from "./sitio";

/** Audios escuchados, guardados solo en este dispositivo. */
export interface Escuchado {
  serie: Serie;
  fecha: string; // fecha del audio
  dia: number;
  en: string; // AAAA-MM-DD en que lo escuchaste (hora de Monterrey)
}

const LLAVE = "escuchados-v1";
const EVENTO = "progreso-cambio";

export function leerEscuchados(): Record<string, Escuchado> {
  try {
    return JSON.parse(localStorage.getItem(LLAVE) ?? "{}") as Record<string, Escuchado>;
  } catch {
    return {};
  }
}

function guardar(todos: Record<string, Escuchado>) {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(todos));
  } catch {}
  window.dispatchEvent(new Event(EVENTO));
}

export function esEscuchado(slug: string) {
  return slug in leerEscuchados();
}

export function marcarEscuchado(slug: string, datos: Omit<Escuchado, "en">) {
  const todos = leerEscuchados();
  if (todos[slug]) return;
  todos[slug] = { ...datos, en: fechaLocal(Date.now()) };
  guardar(todos);
}

export function quitarEscuchado(slug: string) {
  const todos = leerEscuchados();
  delete todos[slug];
  guardar(todos);
}

export function escucharProgreso(alCambiar: () => void) {
  const enStorage = (e: StorageEvent) => e.key === LLAVE && alCambiar();
  window.addEventListener(EVENTO, alCambiar);
  window.addEventListener("storage", enStorage);
  return () => {
    window.removeEventListener(EVENTO, alCambiar);
    window.removeEventListener("storage", enStorage);
  };
}

/** Días seguidos escuchando algo. Si hoy aún no, cuenta desde ayer (la racha no se pierde hasta mañana). */
export function racha(todos = leerEscuchados()) {
  const dias = new Set(Object.values(todos).map((e) => e.en));
  let dia = fechaLocal(Date.now());
  if (!dias.has(dia)) dia = sumarDias(dia, -1);
  let cuenta = 0;
  while (dias.has(dia)) {
    cuenta++;
    dia = sumarDias(dia, -1);
  }
  return { dias: cuenta, hoy: dias.has(fechaLocal(Date.now())) };
}

export function resumen(todos = leerEscuchados()) {
  const hoy = fechaLocal(Date.now());
  const anio = hoy.slice(0, 4);
  const lista = Object.values(todos);
  const delAnio = (serie: Serie) => new Set(lista.filter((e) => e.serie === serie && e.fecha.startsWith(anio)).map((e) => e.dia)).size;
  const diasAnio = Number(anio) % 4 === 0 ? 366 : 365;
  const biblia = delAnio("biblia");
  return {
    total: lista.length,
    anio,
    biblia,
    proverbios: delAnio("proverbios"),
    ninos: delAnio("ninos"),
    diasAnio,
    porcentajeBiblia: Math.round((biblia / diasAnio) * 100),
    ...racha(todos),
  };
}
