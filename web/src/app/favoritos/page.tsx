import type { Metadata } from "next";
import { ListaFavoritos } from "@/components/ListaFavoritos";
import { ResumenProgreso } from "@/components/Progreso";

export const metadata: Metadata = {
  title: "Mi espacio",
  description: "Tu progreso del año y los audios de la Biblia que guardaste en este dispositivo.",
  robots: { index: false },
};

export default function Favoritos() {
  return (
    <>
      <section className="cabeza-pagina cabeza-compacta">
        <div className="contenedor">
          <span className="ceja">En este dispositivo</span>
          <h1 className="titulo-l" style={{ marginTop: 16 }}>
            Mi <span className="serif-it">espacio</span>
          </h1>
          <p>Tu progreso y tus guardados viven solo aquí, sin cuentas. Si borras los datos del navegador o desinstalas la app, se pierden.</p>
        </div>
      </section>
      <div className="contenedor" style={{ paddingTop: 40, paddingBottom: 96, maxWidth: 820 }}>
        <ResumenProgreso />
        <h2 className="titulo-m" style={{ margin: "56px 0 20px" }}>
          Mis guardados
        </h2>
        <ListaFavoritos />
      </div>
    </>
  );
}
