import type { Metadata } from "next";
import { ListaFavoritos } from "@/components/ListaFavoritos";

export const metadata: Metadata = {
  title: "Mis audios guardados",
  description: "Los audios de la Biblia que guardaste en este dispositivo.",
  robots: { index: false },
};

export default function Favoritos() {
  return (
    <>
      <section className="cabeza-pagina cabeza-compacta">
        <div className="contenedor">
          <span className="ceja">En este dispositivo</span>
          <h1 className="titulo-l" style={{ marginTop: 16 }}>
            Mis <span className="serif-it">guardados</span>
          </h1>
          <p>Se guardan solo aquí, sin cuentas. Si borras los datos del navegador o desinstalas la app, se pierden.</p>
        </div>
      </section>
      <div className="contenedor" style={{ paddingTop: 40, paddingBottom: 96, maxWidth: 820 }}>
        <ListaFavoritos />
      </div>
    </>
  );
}
