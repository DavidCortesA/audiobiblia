import type { Metadata } from "next";
import { SITIO } from "@/lib/sitio";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos usa Audio Biblia (casi ninguno), cómo funcionan las notificaciones y los videos de YouTube y Facebook.",
  alternates: { canonical: "/privacidad" },
};

export default function Privacidad() {
  return (
    <>
      <section className="cabeza-pagina">
        <div className="contenedor">
          <span className="ceja">Legal</span>
          <h1 className="titulo-l" style={{ marginTop: 16 }}>Privacidad</h1>
          <p>Lo explicamos claro: este sitio casi no usa datos tuyos.</p>
        </div>
      </section>
      <div className="contenedor">
        <article className="texto-legal">
          <p>
            Audio Biblia es un sitio de {SITIO.iglesia} ({SITIO.ciudad}) para escuchar la lectura diaria de la Biblia. No
            pedimos cuentas, nombres ni correos para usarlo.
          </p>
          <h2>Notificaciones</h2>
          <p>
            Si activas los avisos, tu navegador genera una dirección técnica anónima para enviarte notificaciones. Solo la
            guardamos para mandarte un aviso cuando se publican los audios del día. No incluye tu nombre, correo ni
            ubicación. Puedes desactivarlos cuando quieras desde el botón “Desactivar avisos” o desde los ajustes del
            navegador; al hacerlo se borra.
          </p>
          <h2>Videos de YouTube y Facebook</h2>
          <p>
            Los videos se cargan desde YouTube (en su modo de privacidad mejorada) o desde Facebook únicamente cuando das
            play. A partir de ese momento esos servicios pueden usar cookies según sus propias políticas de privacidad.
          </p>
          <h2>Estadísticas</h2>
          <p>
            Usamos Vercel Web Analytics para saber cuántas personas visitan el sitio. No usa cookies ni identifica a
            personas.
          </p>
          <h2>Almacenamiento en tu dispositivo</h2>
          <p>
            Guardamos en tu navegador que ya viste el aviso de cookies y, si instalas la app, una copia de las páginas para
            que abra más rápido. Nada de eso sale de tu dispositivo.
          </p>
          <h2>Contacto</h2>
          <p>
            Para cualquier duda sobre tus datos escríbenos
            {SITIO.contactoCorreo ? (
              <> a <a href={`mailto:${SITIO.contactoCorreo}`}>{SITIO.contactoCorreo}</a>.</>
            ) : (
              <> por <a href={`https://www.facebook.com/${SITIO.facebook.paginaId}`}>nuestra página de Facebook</a>.</>
            )}
          </p>
        </article>
      </div>
    </>
  );
}
