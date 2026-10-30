"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Página de error: si algo falla al cargar, se puede reintentar sin perder la app. */
export default function ErrorPagina({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="no-encontrado">
      <div>
        <span className="ceja" style={{ color: "var(--sol-claro)" }}>Algo salió mal</span>
        <h1 className="titulo-l" style={{ marginTop: 16 }}>
          No pudimos <span className="serif-it">cargar esto</span>
        </h1>
        <p>Puede ser la conexión o un problema momentáneo. “Clama a mí, y yo te responderé” — Jeremías 33:3.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" className="boton boton-sol" onClick={reset}>
            Intentar de nuevo
          </button>
          <Link className="boton boton-fantasma" href="/">
            Ir al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
