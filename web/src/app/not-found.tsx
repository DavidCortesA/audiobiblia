import Link from "next/link";

export default function NoEncontrado() {
  return (
    <section className="no-encontrado">
      <div>
        <span className="ceja" style={{ color: "var(--sol-claro)" }}>Error 404</span>
        <h1 className="titulo-l" style={{ marginTop: 16 }}>
          Esta página <span className="serif-it">no existe</span>
        </h1>
        <p>“Lámpara es a mis pies tu palabra, y lumbrera a mi camino.” — Salmo 119:105. Te ayudamos a volver al camino:</p>
        <Link className="boton boton-sol" href="/">
          Ir al audio de hoy
        </Link>
      </div>
    </section>
  );
}
