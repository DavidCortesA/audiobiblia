import { Bell, Heart, Mail, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BotonAvisos } from "@/components/BotonAvisos";
import { InstalarApp } from "@/components/InstalarApp";
import { Revelar } from "@/components/Movimiento";
import { SITIO } from "@/lib/sitio";

export const metadata: Metadata = {
  title: "Avisos y app",
  description: "Activa o desactiva el aviso de las 6:00 con los audios del día e instala Audio Biblia en tu celular.",
  alternates: { canonical: "/avisos" },
};

export default function Avisos() {
  return (
    <>
      <section className="cabeza-pagina cabeza-compacta">
        <div className="contenedor">
          <span className="ceja">Ajustes</span>
          <h1 className="titulo-l" style={{ marginTop: 16 }}>
            Avisos <span className="serif-it">y app</span>
          </h1>
        </div>
      </section>
      <div className="contenedor ajustes">
        <Revelar className="ajuste">
          <div className="ajuste-icono" aria-hidden="true"><Bell size={24} /></div>
          <div>
            <h2>Aviso de las 6:00</h2>
            <p>
              Cada mañana, cuando salen los audios del día, te llega una notificación con la lectura de la Biblia, el
              Proverbio y la historia de los niños. Puedes desactivarla aquí cuando quieras.
            </p>
            <BotonAvisos variante="oscuro" />
          </div>
        </Revelar>

        <Revelar className="ajuste solo-web" retraso={0.05}>
          <div className="ajuste-icono" aria-hidden="true"><Smartphone size={24} /></div>
          <div>
            <h2>Instalar la app</h2>
            <p>Tenla a un toque desde tu pantalla de inicio, sin tiendas ni cuentas. En iPhone es necesaria para recibir avisos.</p>
            <InstalarApp claro />
          </div>
        </Revelar>

        <Revelar className="ajuste" retraso={0.08}>
          <div className="ajuste-icono" aria-hidden="true"><Heart size={24} /></div>
          <div>
            <h2>Mi espacio</h2>
            <p>Tu racha, tu avance en la Biblia de este año y los audios que guardaste. Se quedan solo en este dispositivo.</p>
            <Link className="boton boton-contorno" href="/favoritos">
              <Heart size={18} aria-hidden="true" /> Ver mi espacio
            </Link>
          </div>
        </Revelar>

        <Revelar className="ajuste" retraso={0.1}>
          <div className="ajuste-icono" aria-hidden="true"><Mail size={24} /></div>
          <div>
            <h2>Contacto</h2>
            <p>
              {SITIO.congregacion} · {SITIO.iglesia}, {SITIO.ciudad}
              <br />
              <a href={`mailto:${SITIO.contactoCorreo}`}>{SITIO.contactoCorreo}</a>
            </p>
            <p className="ajuste-enlaces">
              <Link href="/privacidad">Privacidad</Link> · <Link href="/terminos">Términos de uso</Link> ·{" "}
              <a href={SITIO.canalYoutube} target="_blank" rel="noopener">YouTube</a> ·{" "}
              <a href={`https://www.facebook.com/${SITIO.facebook.paginaId}`} target="_blank" rel="noopener">Facebook</a>
            </p>
          </div>
        </Revelar>
      </div>
    </>
  );
}
