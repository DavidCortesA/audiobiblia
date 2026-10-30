import type { Metadata } from "next";
import { Buscador } from "@/components/Buscador";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Encuentra un audio de la Biblia por libro, capítulo o historia: Juan 3, Salmo 23, David, Jonás…",
  alternates: { canonical: "/buscar" },
};

export default function Buscar() {
  return (
    <>
      <section className="cabeza-pagina cabeza-compacta">
        <div className="contenedor">
          <span className="ceja">Buscar</span>
          <h1 className="titulo-l" style={{ marginTop: 16 }}>
            Encuentra <span className="serif-it">un audio</span>
          </h1>
        </div>
      </section>
      <div className="contenedor" style={{ paddingTop: 32, paddingBottom: 96, maxWidth: 820 }}>
        <Buscador />
      </div>
    </>
  );
}
