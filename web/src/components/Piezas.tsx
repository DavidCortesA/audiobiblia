import Image from "next/image";
import Link from "next/link";
import { diaSemana, fechaCorta } from "@/lib/fechas";
import { SERIES, SITIO } from "@/lib/sitio";
import type { Video } from "@/lib/tipos";
import { Escalonado, RevelarHijo } from "./Movimiento";

export function TarjetaVideo({ video, prioridad = false }: { video: Video; prioridad?: boolean }) {
  return (
    <Link href={`/${video.serie}/${video.slug}`} className="tarjeta" prefetch={false}>
      <div className="tarjeta-imagen">
        <Image src={video.miniatura} alt={`Portada: ${video.titulo}`} fill sizes="(max-width: 900px) 72vw, 320px" priority={prioridad} />
      </div>
      <div className="tarjeta-fecha">
        {fechaCorta(video.fecha)} · {SERIES[video.serie].corto}
      </div>
      <h3 className="tarjeta-titulo">{video.lectura}</h3>
    </Link>
  );
}

/** Próximos días como línea del horizonte. */
export function Proximos({ videos, hora }: { videos: Video[]; hora: string }) {
  const dias = [...new Set(videos.map((v) => v.fecha))].slice(0, 5);
  if (!dias.length) return <p className="vacio">Pronto aparecerán aquí los audios de los próximos días.</p>;
  return (
    <Escalonado className="horizonte" as="ol">
      {dias.map((fecha, i) => (
        <RevelarHijo key={fecha} as="li" className={`dia-proximo${i === 0 ? " primero" : ""}`}>
          <h3>
            {diaSemana(fecha)} {fechaCorta(fecha)}
          </h3>
          <span className="hora">Se publica a las {hora} a.m.</span>
          <ul>
            {videos
              .filter((v) => v.fecha === fecha)
              .map((v) => (
                <li key={v.slug}>
                  <b>{SERIES[v.serie].corto}</b>
                  {v.lectura}
                </li>
              ))}
          </ul>
        </RevelarHijo>
      ))}
    </Escalonado>
  );
}

export function Pie() {
  return (
    <footer className="pie">
      <div className="contenedor">
        <div className="pie-grid">
          <div>
            <Image className="pie-logo" src="/img/logo-blanco.png" alt="Audio Biblia" width={900} height={265} style={{ height: "auto" }} />
            <p>
              {SITIO.congregacion}
              <br />
              {SITIO.iglesia} · {SITIO.ciudad}
            </p>
            {SITIO.contactoCorreo && (
              <p>
                <a href={`mailto:${SITIO.contactoCorreo}`}>{SITIO.contactoCorreo}</a>
              </p>
            )}
          </div>
          <div>
            <h2>Escuchar</h2>
            <ul>
              <li><Link href="/biblia">Audio Biblia</Link></li>
              <li><Link href="/proverbios">Proverbios del día</Link></li>
              <li><Link href="/ninos">Audio Biblia Niños</Link></li>
            </ul>
          </div>
          <div>
            <h2>Síguenos</h2>
            <ul>
              <li><a href={SITIO.canalYoutube} target="_blank" rel="noopener">YouTube</a></li>
              <li><a href={`https://www.facebook.com/${SITIO.facebook.paginaId}`} target="_blank" rel="noopener">Facebook · {SITIO.facebook.nombre}</a></li>
            </ul>
          </div>
          <div>
            <h2>Sitio</h2>
            <ul>
              <li><Link href="/#app">Instalar la app</Link></li>
              <li><Link href="/privacidad">Privacidad</Link></li>
              <li><Link href="/terminos">Términos de uso</Link></li>
            </ul>
          </div>
        </div>
        <p className="pie-final">Audio Biblia · {SITIO.iglesia} · Nuevo audio cada día a las 6:00 a.m.</p>
      </div>
    </footer>
  );
}
