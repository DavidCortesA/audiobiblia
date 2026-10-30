"use client";

/** Si falla hasta el diseño principal: una página mínima con su propio estilo. */
export default function ErrorGlobal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-MX">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0e1a13", color: "#f8f0e3", fontFamily: "Georgia, serif", textAlign: "center", padding: 24 }}>
        <div>
          <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", color: "#ffd08a", fontSize: 13 }}>Audio Biblia</p>
          <h1 style={{ fontSize: 34, margin: "12px 0" }}>Algo salió mal</h1>
          <p style={{ opacity: 0.75, maxWidth: 360, margin: "0 auto 24px" }}>Intenta de nuevo en un momento.</p>
          <button
            type="button"
            onClick={reset}
            style={{ padding: "14px 26px", borderRadius: 999, border: 0, background: "#f2a541", color: "#0e1a13", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
