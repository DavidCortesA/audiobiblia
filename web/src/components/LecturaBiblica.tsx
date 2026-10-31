import { BookOpenText, ExternalLink } from "lucide-react";
import { textoDeLectura } from "@/lib/biblia";

/** La lectura del audio en texto (Reina-Valera 1909), por secciones, con enlace a la RV1960. */
export function LecturaBiblica({
  lectura,
  titulo = "Lee mientras escuchas",
  nota = "Reina-Valera 1909 · el audio puede leer otra versión",
}: {
  lectura: string;
  titulo?: string;
  nota?: string;
}) {
  const secciones = textoDeLectura(lectura);
  if (!secciones.length) return null;
  return (
    <section className="lectura-texto" id="lectura" aria-labelledby="titulo-lectura">
      <div className="lectura-cabeza">
        <BookOpenText size={26} aria-hidden="true" />
        <div>
          <h2 id="titulo-lectura">{titulo}</h2>
          <p>{nota}</p>
        </div>
      </div>
      {secciones.map((s, i) => (
        <details key={s.titulo + i} open={i === 0}>
          <summary>
            <span>{s.titulo}</span>
            <small>{s.capitulos.reduce((n, c) => n + c.versos.length, 0)} versículos</small>
          </summary>
          {s.capitulos.map((c) => (
            <div key={c.c} className="lectura-capitulo">
              {s.capitulos.length > 1 && <h3>Capítulo {c.c}</h3>}
              <p>
                {c.versos.map((v) => (
                  <span key={v.n}>
                    <sup>{v.n}</sup>
                    {v.t}{" "}
                  </span>
                ))}
              </p>
            </div>
          ))}
          <a className="lectura-rv1960" href={s.enlaceRv1960} target="_blank" rel="noopener">
            Leer {s.titulo} en Reina-Valera 1960 <ExternalLink size={14} aria-hidden="true" />
          </a>
        </details>
      ))}
      <p className="lectura-fuente">Texto bíblico: Reina-Valera 1909, dominio público.</p>
    </section>
  );
}

/** Niños: la historia en texto (transcripción automática del audio), en párrafos. */
export function HistoriaTexto({ titulo, texto }: { titulo: string; texto: string }) {
  const parrafos = texto.split(/\n{2,}/).filter(Boolean);
  const palabras = texto.split(/\s+/).length;
  return (
    <section className="lectura-texto" id="lectura" aria-labelledby="titulo-lectura">
      <div className="lectura-cabeza">
        <BookOpenText size={26} aria-hidden="true" />
        <div>
          <h2 id="titulo-lectura">Lee la historia</h2>
          <p>Transcripción automática del audio · puede tener pequeños errores</p>
        </div>
      </div>
      <details open>
        <summary>
          <span>{titulo}</span>
          <small>{Math.max(1, Math.round(palabras / 200))} min de lectura</small>
        </summary>
        <div className="lectura-capitulo">
          {parrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </details>
    </section>
  );
}
