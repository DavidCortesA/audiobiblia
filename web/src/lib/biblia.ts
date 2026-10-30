/**
 * Texto bíblico Reina-Valera 1909 (dominio público) para las lecturas de cada audio.
 * Los datos están en web/data/rv1909/NN.json (uno por libro, ver scripts/preparar_biblia.py).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

// [nombre, código USFM (YouVersion), alias extra]. El orden es el canónico: índice + 1 = archivo.
const LIBROS: [string, string, string[]?][] = [
  ["Génesis", "GEN"], ["Éxodo", "EXO"], ["Levítico", "LEV"], ["Números", "NUM"], ["Deuteronomio", "DEU"],
  ["Josué", "JOS"], ["Jueces", "JDG"], ["Rut", "RUT"], ["1 Samuel", "1SA"], ["2 Samuel", "2SA"],
  ["1 Reyes", "1KI"], ["2 Reyes", "2KI"], ["1 Crónicas", "1CH"], ["2 Crónicas", "2CH"], ["Esdras", "EZR"],
  ["Nehemías", "NEH"], ["Ester", "EST"], ["Job", "JOB"], ["Salmos", "PSA", ["salmo"]], ["Proverbios", "PRO", ["proverbio"]],
  ["Eclesiastés", "ECC"], ["Cantares", "SNG", ["cantar de los cantares"]], ["Isaías", "ISA"], ["Jeremías", "JER"], ["Lamentaciones", "LAM"],
  ["Ezequiel", "EZK"], ["Daniel", "DAN"], ["Oseas", "HOS"], ["Joel", "JOL"], ["Amós", "AMO"],
  ["Abdías", "OBA"], ["Jonás", "JON"], ["Miqueas", "MIC"], ["Nahúm", "NAM"], ["Habacuc", "HAB"],
  ["Sofonías", "ZEP"], ["Hageo", "HAG"], ["Zacarías", "ZEC"], ["Malaquías", "MAL"], ["Mateo", "MAT"],
  ["Marcos", "MRK"], ["Lucas", "LUK"], ["Juan", "JHN"], ["Hechos", "ACT"], ["Romanos", "ROM"],
  ["1 Corintios", "1CO"], ["2 Corintios", "2CO"], ["Gálatas", "GAL"], ["Efesios", "EPH"], ["Filipenses", "PHP"],
  ["Colosenses", "COL"], ["1 Tesalonicenses", "1TH"], ["2 Tesalonicenses", "2TH"], ["1 Timoteo", "1TI"], ["2 Timoteo", "2TI"],
  ["Tito", "TIT", ["1 tito"]], ["Filemón", "PHM"], ["Hebreos", "HEB"], ["Santiago", "JAS"], ["1 Pedro", "1PE"],
  ["2 Pedro", "2PE"], ["1 Juan", "1JN"], ["2 Juan", "2JN"], ["3 Juan", "3JN"], ["Judas", "JUD"],
  ["Apocalipsis", "REV"],
];

const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Alias normalizados, del más largo al más corto (para que "1 juan" gane sobre "juan").
const ALIAS = LIBROS.flatMap(([nombre, , extra], i) =>
  [nombre, ...(extra ?? [])].map((a) => ({ alias: sinAcentos(a), indice: i })),
).sort((a, b) => b.alias.length - a.alias.length);

export interface Pasaje {
  libro: number; // 0..65
  desde: { c: number; v?: number };
  hasta: { c: number; v?: number };
}

export interface Seccion {
  titulo: string;
  enlaceRv1960: string;
  capitulos: { c: number; versos: { n: number; t: string }[] }[];
}

/** "1a. Timoteo" → "1 timoteo"; quita paréntesis, "Cap." y signos sobrantes. */
function limpiar(lectura: string) {
  return sinAcentos(lectura)
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/\bcap(itulo)?\.?\s*/g, "")
    .replace(/\b([123])\s*a\.?\s+/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

function libroAlInicio(seg: string) {
  for (const { alias, indice } of ALIAS) {
    if (seg === alias || seg.startsWith(alias + " ")) return { indice, resto: seg.slice(alias.length).trim() };
  }
  return null;
}

/** Interpreta un número de referencia ("20", "56:8-13", "15-16", "6:60-7:24") dentro de un libro. */
function referencia(token: string, libro: number): Pasaje | null {
  let m;
  if ((m = token.match(/^(\d+)$/))) return { libro, desde: { c: +m[1] }, hasta: { c: +m[1] } };
  if ((m = token.match(/^(\d+)-(\d+)$/))) return { libro, desde: { c: +m[1] }, hasta: { c: +m[2] } };
  if ((m = token.match(/^(\d+):(\d+)$/))) return { libro, desde: { c: +m[1], v: +m[2] }, hasta: { c: +m[1], v: +m[2] } };
  if ((m = token.match(/^(\d+):(\d+)-(\d+)$/))) return { libro, desde: { c: +m[1], v: +m[2] }, hasta: { c: +m[1], v: +m[3] } };
  if ((m = token.match(/^(\d+):(\d+)-(\d+):(\d+)$/))) return { libro, desde: { c: +m[1], v: +m[2] }, hasta: { c: +m[3], v: +m[4] } };
  // Formatos raros ("6:1-18-7:1"): se toma la primera parte que sí se entiende.
  if ((m = token.match(/^(\d+):(\d+)-(\d+)/))) return { libro, desde: { c: +m[1], v: +m[2] }, hasta: { c: +m[1], v: +m[3] } };
  return null;
}

/** "2 Samuel 20, Salmos 56:8-13, Proverbios 26:17-19 y Juan 3" → pasajes. */
export function parsearLectura(lectura: string): Pasaje[] {
  const pasajes: Pasaje[] = [];
  let libro: number | null = null;
  for (const seg of limpiar(lectura).split(/\s*,\s*(?:y\s+)?|\s+y\s+/)) {
    if (!seg) continue;
    const conLibro = libroAlInicio(seg);
    let resto = seg;
    if (conLibro) {
      libro = conLibro.indice;
      resto = conLibro.resto;
    }
    if (libro === null) continue;
    if (!resto) {
      pasajes.push({ libro, desde: { c: 1 }, hasta: { c: 1 } }); // libros de un capítulo ("Filemón", "Judas")
      continue;
    }
    for (const token of resto.replace(/\s*([:-])\s*/g, "$1").split(" ")) {
      const p = referencia(token, libro);
      // Títulos con error de captura ("107:17-2"): se muestra al menos el versículo inicial.
      if (p && p.desde.c === p.hasta.c && p.desde.v && p.hasta.v && p.hasta.v < p.desde.v) p.hasta.v = p.desde.v;
      if (p) pasajes.push(p);
    }
  }
  return pasajes;
}

const cache = new Map<number, string[][]>();

function capitulosDe(libro: number): string[][] {
  if (!cache.has(libro)) {
    const archivo = join(process.cwd(), "data", "rv1909", `${String(libro + 1).padStart(2, "0")}.json`);
    cache.set(libro, (JSON.parse(readFileSync(archivo, "utf8")) as { c: string[][] }).c);
  }
  return cache.get(libro)!;
}

function tituloDe(p: Pasaje) {
  const [nombre] = LIBROS[p.libro];
  const { desde: d, hasta: h } = p;
  if (d.v == null) return d.c === h.c ? `${nombre} ${d.c}` : `${nombre} ${d.c}-${h.c}`;
  if (d.c === h.c) return d.v === h.v ? `${nombre} ${d.c}:${d.v}` : `${nombre} ${d.c}:${d.v}-${h.v}`;
  return `${nombre} ${d.c}:${d.v}-${h.c}:${h.v}`;
}

/** Texto RV1909 de cada pasaje de la lectura (se omiten las referencias que no existan). */
export function textoDeLectura(lectura: string): Seccion[] {
  return parsearLectura(lectura).flatMap((p): Seccion[] => {
    const caps = capitulosDe(p.libro);
    const capitulos: Seccion["capitulos"] = [];
    for (let c = p.desde.c; c <= p.hasta.c; c++) {
      const versos = caps[c - 1];
      if (!versos) continue;
      const primero = c === p.desde.c && p.desde.v ? p.desde.v : 1;
      const ultimo = c === p.hasta.c && p.hasta.v ? p.hasta.v : versos.length;
      const elegidos = versos.slice(primero - 1, ultimo).map((t, i) => ({ n: primero + i, t }));
      if (elegidos.length) capitulos.push({ c, versos: elegidos });
    }
    if (!capitulos.length) return [];
    const [, usfm] = LIBROS[p.libro];
    return [{ titulo: tituloDe(p), enlaceRv1960: `https://www.bible.com/es/bible/149/${usfm}.${p.desde.c}.RVR1960`, capitulos }];
  });
}
