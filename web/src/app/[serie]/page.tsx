import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Escalonado, Revelar, RevelarHijo } from "@/components/Movimiento";
import { Proximos, TarjetaVideo } from "@/components/Piezas";
import { delAnio, getCatalogo, proverbiosDelMes } from "@/lib/datos";
import { fechaCorta } from "@/lib/fechas";
import { LISTA_SERIES, SERIES, SITIO, esSerie } from "@/lib/sitio";

/** Se entrega la página completa (no un esqueleto): mejor para buscadores y 404 reales. */
export const instant = false;

export function generateStaticParams() {
  return LISTA_SERIES.map((serie) => ({ serie }));
}

export async function generateMetadata({ params }: PageProps<"/[serie]">): Promise<Metadata> {
  const { serie } = await params;
  if (!esSerie(serie)) return {};
  return {
    title: SERIES[serie].tituloSeo,
    description: `${SERIES[serie].descripcion} Escúchalos aquí, en YouTube o en Facebook.`,
    alternates: { canonical: `/${serie}` },
  };
}

const VISIBLES = 10;

export default async function PaginaSerie({ params }: PageProps<"/[serie]">) {
  const { serie } = await params;
  if (!esSerie(serie)) notFound();
  const { publicados, proximos, hoy } = await getCatalogo();
  const siguientes = proximos.filter((v) => v.serie === serie);
  const anio = hoy.slice(0, 4);
  const proverbios = serie === "proverbios" ? proverbiosDelMes(publicados) : [];
  const delAño = serie === "proverbios" ? [] : delAnio(publicados, serie, hoy);
  const capituloHoy = Number(hoy.slice(8, 10));

  return (
    <>
      <section className="cabeza-pagina">
        <div className="contenedor cabeza-serie">
          <Revelar>
            <span className="ceja">{serie === "proverbios" ? "Un capítulo por cada día del mes" : `Lectura diaria · ${anio}`}</span>
            <h1 className="titulo-l" style={{ marginTop: 16 }}>
              {SERIES[serie].nombre}
            </h1>
            <p>{SERIES[serie].descripcion}</p>
          </Revelar>
          <Revelar retraso={0.1} className="contador">
            <span className="contador-numero">{serie === "proverbios" ? proverbios.length : delAño.length}</span>
            <span className="contador-texto">
              {serie === "proverbios" ? "capítulos, siempre en su versión más reciente" : `audios publicados en ${anio}`}
            </span>
          </Revelar>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          {serie === "proverbios" ? (
            proverbios.length ? (
              <Escalonado className="mes-proverbios" as="ol">
                {proverbios.map(({ capitulo, video }) => (
                  <RevelarHijo key={capitulo} as="li">
                    <Link
                      href={`/proverbios/${video.slug}`}
                      prefetch={false}
                      className={`capitulo${capitulo === capituloHoy ? " capitulo-hoy" : ""}`}
                      aria-label={`Proverbios ${capitulo}${capitulo === capituloHoy ? " (hoy)" : ""}, publicado el ${fechaCorta(video.fecha)}`}
                    >
                      <span className="capitulo-numero">{capitulo}</span>
                      <span className="capitulo-fecha">{capitulo === capituloHoy ? "Hoy" : fechaCorta(video.fecha)}</span>
                    </Link>
                  </RevelarHijo>
                ))}
              </Escalonado>
            ) : (
              <p className="vacio">Aún no hay capítulos publicados.</p>
            )
          ) : delAño.length ? (
            <>
              <div className="seccion-cabeza">
                <div>
                  <span className="ceja">Los más recientes</span>
                  <h2 className="titulo-m">
                    Del Día {delAño[Math.min(VISIBLES, delAño.length) - 1].dia} al Día {delAño[0].dia}
                  </h2>
                </div>
              </div>
              <div className="rejilla-videos">
                {delAño.slice(0, VISIBLES).map((v, i) => (
                  <TarjetaVideo key={v.slug} video={v} prioridad={i < 3} />
                ))}
              </div>
              {delAño.length > VISIBLES && (
                <Revelar className="ver-mas-youtube">
                  <p>
                    <b>{delAño.length - VISIBLES} audios más</b> de {anio}, desde el Día {delAño[delAño.length - 1].dia}.
                  </p>
                  <a
                    className="boton boton-oscuro"
                    href={SITIO.buscarEnYoutube(SERIES[serie].busquedaYoutube)}
                    target="_blank"
                    rel="noopener"
                  >
                    Ver los {delAño.length} en YouTube ↗
                  </a>
                </Revelar>
              )}
            </>
          ) : (
            <p className="vacio">Aún no hay audios publicados este año.</p>
          )}

          {siguientes.length > 0 && (
            <div style={{ marginTop: 96 }}>
              <div className="seccion-cabeza">
                <div>
                  <span className="ceja">Próximamente</span>
                  <h2 className="titulo-m">Los siguientes días</h2>
                </div>
              </div>
              <Proximos videos={siguientes} hora="6:00" />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
