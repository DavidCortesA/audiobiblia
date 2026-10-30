import type { Metadata } from "next";
import { SITIO } from "@/lib/sitio";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Condiciones para usar el sitio y la app de Audio Biblia de Castillo del Rey.",
  alternates: { canonical: "/terminos" },
};

export default function Terminos() {
  return (
    <>
      <section className="cabeza-pagina">
        <div className="contenedor">
          <span className="ceja">Legal</span>
          <h1 className="titulo-l" style={{ marginTop: 16 }}>Términos de uso</h1>
          <p>Un servicio gratuito para escuchar la Palabra cada día.</p>
        </div>
      </section>
      <div className="contenedor">
        <article className="texto-legal">
          <h2>Uso del sitio</h2>
          <p>
            Audio Biblia es un servicio gratuito de {SITIO.iglesia}. Puedes escuchar, compartir los enlaces e instalar la
            app libremente para uso personal, familiar y ministerial.
          </p>
          <h2>Contenido</h2>
          <p>
            Los audios y videos pertenecen a {SITIO.iglesia} y se publican en su canal de YouTube y en sus páginas de
            Facebook. Para usarlos en otros medios o volver a publicarlos, pide autorización.
          </p>
          <h2>Disponibilidad</h2>
          <p>
            Publicamos un audio nuevo cada mañana a las 6:00 (hora de Monterrey). Puede haber días con retraso o cambios
            en el calendario; los próximos días que se muestran son una guía.
          </p>
          <h2>Servicios de terceros</h2>
          <p>
            La reproducción de los videos depende de YouTube y Facebook, y se rige también por sus propios términos de
            servicio.
          </p>
          <h2>Cambios</h2>
          <p>Podemos actualizar estos términos; la versión vigente siempre estará en esta página.</p>
        </article>
      </div>
    </>
  );
}
