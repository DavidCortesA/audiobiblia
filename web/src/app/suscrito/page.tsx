import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "¡Avisos activados!",
  description: "Recibirás un aviso cada mañana cuando se publiquen los audios de Audio Biblia.",
  robots: { index: false },
};

export default function Suscrito() {
  return (
    <section className="no-encontrado">
      <div>
        <span className="ceja" style={{ color: "var(--sol-claro)" }}>Avisos activados</span>
        <h1 className="titulo-l" style={{ marginTop: 16 }}>
          Nos vemos <span className="serif-it">mañana a las 6:00</span>
        </h1>
        <p>
          Cada mañana te llegará un aviso con la lectura de la Biblia, el Proverbio del día y la historia de los niños.
          Puedes desactivarlo cuando quieras desde la sección de la app.
        </p>
        <Link className="boton boton-sol" href="/#hoy">
          Escuchar la lectura de hoy
        </Link>
      </div>
    </section>
  );
}
