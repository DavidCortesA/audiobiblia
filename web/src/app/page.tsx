import Image from "next/image";
import Link from "next/link";
import { BotonAvisos } from "@/components/BotonAvisos";
import { InstalarApp } from "@/components/InstalarApp";
import { EntradaHero, LineaHero, Revelar } from "@/components/Movimiento";
import { Proximos, TarjetaVideo } from "@/components/Piezas";
import { Reproductor } from "@/components/Reproductor";
import { getCatalogo, ultimoDia } from "@/lib/datos";
import { fechaLarga } from "@/lib/fechas";
import { LISTA_SERIES, SERIES, SITIO } from "@/lib/sitio";
import amanecer from "../../public/img/amanecer.jpg";

export default async function Inicio() {
  const { publicados, proximos, hoy } = await getCatalogo();
  const delDia = ultimoDia(publicados);
  const esHoy = delDia[0]?.fecha === hoy;
  const diaNumero = delDia.find((v) => v.serie === "biblia")?.dia ?? delDia[0]?.dia;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITIO.nombreLargo,
        url: SITIO.url,
        inLanguage: "es-MX",
        description: SITIO.descripcion,
      },
      {
        "@type": "Organization",
        name: SITIO.iglesia,
        url: SITIO.url,
        logo: `${SITIO.url}/icon-512.png`,
        sameAs: [SITIO.canalYoutube, `https://www.facebook.com/${SITIO.facebook.paginaId}`],
        address: { "@type": "PostalAddress", addressLocality: "Monterrey", addressCountry: "MX" },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="hero">
        <div className="hero-fondo">
          <Image src={amanecer} alt="Amanecer sobre un valle entre montañas y bosque" fill priority placeholder="blur" sizes="100vw" />
        </div>
        <div className="contenedor hero-contenido">
          <EntradaHero>
            <LineaHero>
              <span className="ceja">
                {fechaLarga(hoy)}
                {diaNumero && esHoy ? ` · Día ${diaNumero}` : ""}
              </span>
            </LineaHero>
            <LineaHero>
              <h1 className="titulo-xl">
                La Palabra
                <span className="serif-it">en cada amanecer</span>
              </h1>
            </LineaHero>
            <LineaHero>
              <p className="hero-texto">
                Escucha la Biblia completa en un año, el Proverbio del día y una historia bíblica para los niños. Un audio
                nuevo cada mañana a las 6:00.
              </p>
            </LineaHero>
            <LineaHero>
              <div className="hero-acciones">
                <a className="boton boton-sol" href="#hoy">
                  ▶ Escuchar el audio de hoy
                </a>
                <a className="boton boton-fantasma solo-web" href="#app">
                  Recibir avisos
                </a>
              </div>
            </LineaHero>
          </EntradaHero>
        </div>
      </section>

      <section className="hoy" id="hoy" aria-label="Audios del día">
        <div className="contenedor">
          {delDia.length ? (
            <Reproductor
              etiqueta={esHoy ? `Hoy · ${fechaLarga(hoy)}` : `Lo más reciente · ${fechaLarga(delDia[0].fecha)}`}
              videos={delDia.map(({ slug, serie, titulo, lectura, youtube, facebook, miniatura }) => ({
                slug, serie, titulo, lectura, youtube, facebook, miniatura,
              }))}
            />
          ) : (
            <p className="vacio">Muy pronto estarán aquí los audios del día.</p>
          )}
        </div>
      </section>

      <section className="seccion" aria-labelledby="titulo-proximos" style={{ paddingTop: 24 }}>
        <div className="contenedor">
          <Revelar className="seccion-cabeza">
            <div>
              <span className="ceja">Próximos 5 días</span>
              <h2 className="titulo-l" id="titulo-proximos">
                Lo que viene
              </h2>
            </div>
            <p>Así puedes adelantarte o prepararte: cada audio se publica a las 6:00 a.m. del día que le toca.</p>
          </Revelar>
          <Proximos videos={proximos} hora="6:00" />
        </div>
      </section>

      <section className="seccion" aria-label="Series" style={{ paddingTop: 0 }}>
        <div className="contenedor">
          {LISTA_SERIES.map((serie, i) => {
            const lista = publicados.filter((v) => v.serie === serie).slice(0, 3);
            return (
              <div key={serie} className="serie-bloque">
                <Revelar>
                  <span className="numero">0{i + 1}</span>
                  <h2 className="titulo-m" style={{ marginTop: 12 }}>
                    {SERIES[serie].nombre}
                  </h2>
                  <p>{SERIES[serie].descripcion}</p>
                  <Link className="ver-todo" href={`/${serie}`}>
                    Ver todos →
                  </Link>
                </Revelar>
                <div className="rejilla-videos">
                  {lista.map((v) => (
                    <TarjetaVideo key={v.slug} video={v} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="seccion app solo-web" id="app" aria-labelledby="titulo-app">
        <div className="contenedor app-grid">
          <Revelar>
            <span className="ceja">App y avisos</span>
            <h2 className="titulo-l" id="titulo-app" style={{ marginTop: 16 }}>
              Llévala <span className="serif-it">en tu celular</span>
            </h2>
            <p style={{ maxWidth: "44ch", margin: "20px 0 28px" }}>
              Instálala como app en tu pantalla de inicio y recibe un aviso cada mañana cuando salgan los audios del día.
              Sin descargas de tiendas, sin cuentas.
            </p>
            <BotonAvisos />
          </Revelar>
          <Revelar retraso={0.1}>
            <ol className="app-pasos">
              <li>
                <div>
                  <h3>Instala la app</h3>
                  <InstalarApp />
                </div>
              </li>
              <li>
                <div>
                  <h3>Activa los avisos</h3>
                  <p>Te llega una notificación a las 6:00 con la lectura, el Proverbio y la historia de los niños.</p>
                </div>
              </li>
              <li>
                <div>
                  <h3>Escucha donde prefieras</h3>
                  <p>Aquí mismo, en YouTube o en Facebook. Tú eliges.</p>
                </div>
              </li>
            </ol>
          </Revelar>
        </div>
      </section>
    </>
  );
}
