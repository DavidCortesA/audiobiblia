/* eslint-disable @next/next/no-img-element -- next/og dibuja con <img>, no con next/image */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { partesLectura } from "./datos";
import { fechaLarga } from "./fechas";
import { SERIES, SITIO } from "./sitio";
import type { Video } from "./tipos";

const raiz = process.cwd();
const archivo = (ruta: string) => readFile(join(raiz, ruta));

// Se leen una sola vez por instancia.
const recursos = Promise.all([
  archivo("assets/fonts/josefin-sans-latin-700-normal.woff"),
  archivo("assets/fonts/josefin-sans-latin-600-normal.woff"),
  archivo("assets/fonts/literata-latin-400-italic.woff"),
  archivo("public/img/amanecer-1200.jpg"),
  archivo("public/img/logo-blanco.png"),
]);

const SOL = "#f2a541";
const SOL_CLARO = "#ffd08a";
const CREMA = "#f8f0e3";
const NOCHE = "#0e1a13";

const capital = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function textos(video: Video) {
  if (video.serie === "biblia") {
    const [principal] = partesLectura(video.lectura);
    const resto = video.lectura
      .replace(/\(.*?\)|\[.*?\]/g, "")
      .slice(principal.length)
      .replace(/^[,\s]+/, "")
      .split(/,\s*(?=\p{L})|\s+y\s+/u)
      .map((p) => p.trim())
      .filter(Boolean)
      .join("  ·  ");
    return { grande: principal, chico: resto };
  }
  if (video.serie === "ninos") return { grande: video.lectura, chico: "Una historia de la Biblia para los más pequeños" };
  return { grande: video.lectura, chico: "Sabiduría para las decisiones de hoy" };
}

/** Imagen de un audio: amanecer, logo, serie, fecha y lectura. */
export async function imagenVideo(video: Video, ancho: number, alto: number) {
  const [josefin700, josefin600, literataItalica, fondo, logo] = await recursos;
  const vertical = alto > ancho;
  const { grande, chico } = textos(video);
  const escala = vertical ? 1.25 : 1;
  const tamGrande = Math.round((grande.length > 22 ? 72 : grande.length > 14 ? 88 : 104) * escala);
  const dia = video.serie === "proverbios" ? "" : ` · Día ${video.dia}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: NOCHE }}>
        <img
          src={`data:image/jpeg;base64,${fondo.toString("base64")}`}
          width={ancho}
          height={alto}
          style={{ position: "absolute", top: 0, left: 0, width: ancho, height: alto, objectFit: "cover" }}
          alt=""
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: ancho,
            height: alto,
            display: "flex",
            background: vertical
              ? "linear-gradient(180deg, rgba(14,26,19,0.55) 0%, rgba(14,26,19,0.15) 30%, rgba(14,26,19,0.85) 62%, #0e1a13 100%)"
              : "linear-gradient(90deg, rgba(14,26,19,0.92) 0%, rgba(14,26,19,0.7) 48%, rgba(14,26,19,0.15) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: vertical ? "80px 72px 88px" : "64px 72px",
          }}
        >
          <img src={`data:image/png;base64,${logo.toString("base64")}`} width={vertical ? 380 : 300} height={vertical ? 112 : 88} alt="" />
          <div style={{ display: "flex", flexDirection: "column", maxWidth: vertical ? "100%" : 820 }}>
            <div style={{ display: "flex", fontFamily: "Josefin", fontWeight: 600, fontSize: 26 * escala, letterSpacing: 6, color: SOL_CLARO, textTransform: "uppercase" }}>
              {SERIES[video.serie].nombre}
            </div>
            <div style={{ display: "flex", fontFamily: "Josefin", fontWeight: 600, fontSize: 24 * escala, letterSpacing: 2, color: "rgba(248,240,227,0.75)", marginTop: 10 }}>
              {`${capital(fechaLarga(video.fecha))}${dia}`}
            </div>
            <div style={{ display: "flex", fontFamily: "Josefin", fontWeight: 700, fontSize: tamGrande, lineHeight: 1, color: CREMA, marginTop: 28, textTransform: video.serie === "ninos" ? "none" : "uppercase" }}>
              {grande}
            </div>
            {chico && (
              <div style={{ display: "flex", fontFamily: "Literata", fontStyle: "italic", fontSize: 32 * escala, lineHeight: 1.35, color: SOL_CLARO, marginTop: 22 }}>
                {chico}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 64 * escala, height: 64 * escala, borderRadius: 999, background: SOL }}>
              <svg width={30 * escala} height={30 * escala} viewBox="0 0 24 24" style={{ marginLeft: 4 * escala }}>
                <path d="M7 4.5v15l12.5-7.5z" fill={NOCHE} />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontFamily: "Josefin", fontWeight: 700, fontSize: 26 * escala, color: CREMA, letterSpacing: 1 }}>Escúchalo hoy</div>
              <div style={{ display: "flex", fontFamily: "Josefin", fontWeight: 600, fontSize: 22 * escala, color: "rgba(248,240,227,0.7)" }}>
                {SITIO.url.replace(/^https?:\/\//, "")}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: ancho,
      height: alto,
      fonts: [
        { name: "Josefin", data: josefin700, weight: 700, style: "normal" },
        { name: "Josefin", data: josefin600, weight: 600, style: "normal" },
        { name: "Literata", data: literataItalica, weight: 400, style: "italic" },
      ],
    },
  );
}
