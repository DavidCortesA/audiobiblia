import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonAvisos } from "@/components/BotonAvisos";
import { Revelar } from "@/components/Movimiento";
import { ReproductorUnico } from "@/components/Reproductor";
import { getCatalogo, getVideo, partesLectura } from "@/lib/datos";
import { fechaLarga } from "@/lib/fechas";
import { SERIES, SITIO, esSerie } from "@/lib/sitio";

/** Se entrega la página completa (no un esqueleto): mejor para buscadores y 404 reales. */
export const instant = false;

export async function generateStaticParams({ params }: { params: { serie: string } | Promise<{ serie: string }> }) {
  const { serie } = await params;
  const { publicados } = await getCatalogo();
  const recientes = publicados.filter((v) => v.serie === serie).slice(0, 30).map((v) => ({ slug: v.slug }));
  // Cache Components exige al menos una ruta; si la serie aún no tiene audios, una de ejemplo que da 404.
  return recientes.length ? recientes : [{ slug: "sin-audios" }];
}

function resumen(texto: string, max = 155) {
  const limpio = texto.replace(/#\S+/g, "").replace(/\s+/g, " ").trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
}

export async function generateMetadata({ params }: PageProps<"/[serie]/[slug]">): Promise<Metadata> {
  const { serie, slug } = await params;
  if (!esSerie(serie)) return {};
  const datos = await getVideo(serie, slug);
  if (!datos) return { title: "Audio no encontrado" };
  const { video } = datos;
  const [principal] = partesLectura(video.lectura);
  const titulo = serie === "biblia" ? `${principal} — Audio Biblia Día ${video.dia}` : video.titulo;
  const descripcion = resumen(
    `${SERIES[serie].nombre}, ${fechaLarga(video.fecha)}: ${video.lectura}. ${video.descripcion}`,
  );
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/${serie}/${slug}` },
    openGraph: {
      type: "video.other",
      title: titulo,
      description: descripcion,
      videos: video.youtube ? [{ url: `https://www.youtube.com/watch?v=${video.youtube}` }] : undefined,
    },
  };
}

export default async function PaginaVideo({ params }: PageProps<"/[serie]/[slug]">) {
  const { serie, slug } = await params;
  if (!esSerie(serie)) notFound();
  const datos = await getVideo(serie, slug);
  if (!datos) notFound();
  const { video, anterior, siguiente } = datos;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.titulo,
    description: resumen(video.descripcion || video.lectura, 500),
    thumbnailUrl: [video.miniatura],
    uploadDate: video.publicar,
    inLanguage: "es",
    embedUrl: video.youtube ? `https://www.youtube.com/embed/${video.youtube}` : undefined,
    contentUrl: video.youtube ? `https://www.youtube.com/watch?v=${video.youtube}` : undefined,
    publisher: { "@type": "Organization", name: SITIO.iglesia, logo: { "@type": "ImageObject", url: `${SITIO.url}/icon-512.png` } },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="cabeza-pagina" style={{ paddingBottom: 48 }}>
        <div className="contenedor">
          <Revelar>
            <span className="ceja">
              <Link href={`/${serie}`} style={{ textDecoration: "none" }}>
                {SERIES[serie].nombre}
              </Link>{" "}
              · {fechaLarga(video.fecha)}
            </span>
            <h1 className="titulo-m" style={{ marginTop: 16, maxWidth: "28ch" }}>
              {video.titulo}
            </h1>
          </Revelar>
        </div>
      </section>
      <div className="contenedor video-pagina">
        <div>
          <ReproductorUnico
            video={{
              slug: video.slug,
              serie: video.serie,
              titulo: video.titulo,
              lectura: video.lectura,
              youtube: video.youtube,
              facebook: video.facebook,
              miniatura: video.miniatura,
              fecha: video.fecha,
              dia: video.dia,
              audio: video.audio ?? null,
            }}
          />
          <nav className="navegacion-videos" aria-label="Otros audios de la serie">
            {anterior ? (
              <Link href={`/${serie}/${anterior.slug}`}>
                <small><ArrowLeft size={12} aria-hidden="true" /> Anterior</small>
                {anterior.lectura}
              </Link>
            ) : <span />}
            {siguiente ? (
              <Link href={`/${serie}/${siguiente.slug}`} style={{ textAlign: "right" }}>
                <small>Siguiente <ArrowRight size={12} aria-hidden="true" /></small>
                {siguiente.lectura}
              </Link>
            ) : <span />}
          </nav>
        </div>
        <aside>
          <span className="ceja" style={{ color: "var(--brasa)" }}>
            {serie === "biblia" ? "Lectura de hoy" : serie === "ninos" ? "La historia" : "Capítulo"}
          </span>
          <p className="lectura-grande">{video.lectura}</p>
          <p className="video-descripcion">{video.descripcion}</p>
          <div style={{ marginTop: 32 }}>
            <BotonAvisos variante="oscuro" />
          </div>
        </aside>
      </div>
    </>
  );
}
