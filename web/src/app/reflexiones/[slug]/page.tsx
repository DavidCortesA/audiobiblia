import { ArrowLeft, ArrowRight, ExternalLink, Headphones } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonAvisos } from "@/components/BotonAvisos";
import { LecturaBiblica } from "@/components/LecturaBiblica";
import { Revelar } from "@/components/Movimiento";
import { CompartirReflexion, VideoFacebook } from "@/components/Reflexion";
import { capituloDeCita, getCatalogo, getReflexion, getReflexiones, proverbiosDelMes } from "@/lib/datos";
import { fechaLarga } from "@/lib/fechas";
import { REFLEXIONES, SITIO } from "@/lib/sitio";

/** Se entrega la página completa (no un esqueleto): mejor para buscadores y 404 reales. */
export const instant = false;

export async function generateStaticParams() {
  const lista = await getReflexiones();
  // Cache Components exige al menos una ruta; si aún no hay reflexiones, una de ejemplo que da 404.
  return lista.length ? lista.map((r) => ({ slug: r.slug })) : [{ slug: "sin-reflexiones" }];
}

function resumen(texto: string, max = 155) {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
}

export async function generateMetadata({ params }: PageProps<"/reflexiones/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const datos = await getReflexion(slug);
  if (!datos) return { title: "Reflexión no encontrada" };
  const { reflexion: r } = datos;
  const titulo = `${r.cita} — Reflexión en video`;
  const descripcion = resumen(`“${r.texto}” (${r.cita}). Una reflexión corta sobre este versículo, ${fechaLarga(r.fecha)}.`);
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/reflexiones/${slug}` },
    openGraph: {
      type: "video.other",
      title: titulo,
      description: descripcion,
      images: r.miniatura ? [{ url: r.miniatura }] : undefined,
      videos: [{ url: r.url }],
    },
  };
}

export default async function PaginaReflexion({ params }: PageProps<"/reflexiones/[slug]">) {
  const { slug } = await params;
  const datos = await getReflexion(slug);
  if (!datos) notFound();
  const { reflexion: r, anterior, siguiente } = datos;

  // Enlace al Proverbio completo en audio, si la reflexión es de Proverbios.
  const capitulo = capituloDeCita(r.cita);
  const { publicados } = await getCatalogo();
  const audioCapitulo = capitulo ? proverbiosDelMes(publicados).find((p) => p.capitulo === capitulo)?.video : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `Reflexión: ${r.cita}`,
    description: r.texto || r.cita,
    thumbnailUrl: [r.miniatura ?? `${SITIO.url}/img/amanecer-1200.jpg`],
    uploadDate: r.publicado,
    duration: r.duracion ? `PT${r.duracion}S` : undefined,
    inLanguage: "es",
    embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(r.url)}`,
    publisher: { "@type": "Organization", name: SITIO.iglesia, logo: { "@type": "ImageObject", url: `${SITIO.url}/icon-512.png` } },
  };
  const migas = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITIO.url },
      { "@type": "ListItem", position: 2, name: REFLEXIONES.nombre, item: `${SITIO.url}/reflexiones` },
      { "@type": "ListItem", position: 3, name: r.cita, item: `${SITIO.url}/reflexiones/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(migas) }} />
      <section className="cabeza-pagina" style={{ paddingBottom: 48 }}>
        <div className="contenedor">
          <Revelar>
            <span className="ceja">
              <Link href="/reflexiones" style={{ textDecoration: "none" }}>
                {REFLEXIONES.nombre}
              </Link>{" "}
              · {fechaLarga(r.fecha)}
            </span>
            <h1 className="titulo-m" style={{ marginTop: 16, maxWidth: "28ch" }}>
              {r.cita}
            </h1>
          </Revelar>
        </div>
      </section>
      <div className="contenedor video-pagina">
        <div>
          <div className="marco">
            <VideoFacebook url={r.url} titulo={`Reflexión: ${r.cita}`} miniatura={r.miniatura ?? "/img/amanecer-1200.jpg"} />
          </div>
          <div className="acciones acciones-claro" style={{ marginTop: 16 }}>
            <CompartirReflexion slug={r.slug} cita={r.cita} texto={r.texto} />
            <a className="accion" href={r.url} target="_blank" rel="noopener">
              <ExternalLink size={18} aria-hidden="true" /> Ver en Facebook
            </a>
          </div>
          <nav className="navegacion-videos" aria-label="Otras reflexiones">
            {anterior ? (
              <Link href={`/reflexiones/${anterior.slug}`}>
                <small><ArrowLeft size={12} aria-hidden="true" /> Anterior</small>
                {anterior.cita}
              </Link>
            ) : <span />}
            {siguiente ? (
              <Link href={`/reflexiones/${siguiente.slug}`} style={{ textAlign: "right" }}>
                <small>Siguiente <ArrowRight size={12} aria-hidden="true" /></small>
                {siguiente.cita}
              </Link>
            ) : <span />}
          </nav>
        </div>
        <aside>
          <span className="ceja" style={{ color: "var(--brasa)" }}>
            El versículo
          </span>
          {r.texto && (
            <blockquote className="cita-reflexion">
              <p>“{r.texto}”</p>
              <footer>
                {r.cita}
                {r.version ? ` · ${r.version}` : ""}
              </footer>
            </blockquote>
          )}
          {audioCapitulo && (
            <Link className="boton boton-oscuro" href={`/proverbios/${audioCapitulo.slug}`} style={{ marginTop: 8 }}>
              <Headphones size={18} aria-hidden="true" /> Escuchar Proverbios {capitulo} completo
            </Link>
          )}
          <div style={{ marginTop: 32 }}>
            <BotonAvisos variante="oscuro" />
          </div>
        </aside>
      </div>
      {capitulo && (
        <div className="contenedor">
          <LecturaBiblica lectura={`Proverbios ${capitulo}`} titulo="Lee el capítulo completo" nota="Reina-Valera 1909" />
        </div>
      )}
    </>
  );
}
