import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { Revelar } from "@/components/Movimiento";
import { TarjetaReflexion } from "@/components/Piezas";
import { getReflexiones } from "@/lib/datos";
import { REFLEXIONES, SITIO } from "@/lib/sitio";

/** Se entrega la página completa (no un esqueleto): mejor para buscadores. */
export const instant = false;

export const metadata: Metadata = {
  title: REFLEXIONES.tituloSeo,
  description: `${REFLEXIONES.descripcion} Míralas aquí o en Facebook.`,
  alternates: { canonical: "/reflexiones" },
};

export default async function PaginaReflexiones() {
  const reflexiones = await getReflexiones();
  const anio = reflexiones.at(-1)?.fecha.slice(0, 4);

  const datos = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: REFLEXIONES.tituloSeo,
    description: REFLEXIONES.descripcion,
    url: `${SITIO.url}/reflexiones`,
    inLanguage: "es-MX",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITIO.url },
        { "@type": "ListItem", position: 2, name: REFLEXIONES.nombre, item: `${SITIO.url}/reflexiones` },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }} />
      <section className="cabeza-pagina">
        <div className="contenedor cabeza-serie">
          <Revelar>
            <span className="ceja">Un versículo, una reflexión</span>
            <h1 className="titulo-l" style={{ marginTop: 16 }}>
              {REFLEXIONES.nombre}
            </h1>
            <p>{REFLEXIONES.descripcion}</p>
          </Revelar>
          <Revelar retraso={0.1} className="contador">
            <span className="contador-numero">{reflexiones.length}</span>
            <span className="contador-texto">{anio ? `reflexiones desde ${anio}` : "reflexiones"}</span>
          </Revelar>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          {reflexiones.length ? (
            <div className="rejilla-videos">
              {reflexiones.map((r, i) => (
                <TarjetaReflexion key={r.slug} reflexion={r} prioridad={i < 3} />
              ))}
            </div>
          ) : (
            <p className="vacio">Muy pronto estarán aquí las reflexiones.</p>
          )}
          <Revelar className="ver-mas-youtube">
            <p>
              Cada reflexión se publica primero en la página <b>{REFLEXIONES.paginaFacebook}</b> de Facebook.
            </p>
            <a
              className="boton boton-oscuro"
              href={`https://www.facebook.com/${REFLEXIONES.paginaFacebookId}`}
              target="_blank"
              rel="noopener"
            >
              Seguir en Facebook <ExternalLink size={16} aria-hidden="true" />
            </a>
          </Revelar>
        </div>
      </section>
    </>
  );
}
