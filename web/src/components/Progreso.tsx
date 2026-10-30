"use client";

import { BookOpen, CircleCheck, Flame, Headphones } from "lucide-react";
import { useEffect, useState } from "react";
import { escucharProgreso, esEscuchado, resumen } from "@/lib/progreso";

/** Hook: se vuelve a calcular cuando cambia el progreso (en esta pestaña u otra). */
function useProgreso<T>(calcular: () => T, inicial: T) {
  const [valor, setValor] = useState<T>(inicial);
  useEffect(() => {
    const actualizar = () => setValor(calcular());
    actualizar();
    return escucharProgreso(actualizar);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `calcular` depende solo de las props de quien lo llama
  }, []);
  return valor;
}

/** Palomita sobre lo que ya escuchaste. */
export function MarcaEscuchado({ slug, variante }: { slug: string; variante: "tarjeta" | "capitulo" | "pestana" }) {
  const escuchado = useProgreso(() => esEscuchado(slug), false);
  if (!escuchado) return null;
  return (
    <span className={`marca-escuchado marca-${variante}`} title="Ya lo escuchaste">
      <CircleCheck size={variante === "pestana" ? 15 : 18} aria-hidden="true" />
      <span className="solo-lectores">Escuchado</span>
    </span>
  );
}

/** "🔥 3 días seguidos" para el panel de Hoy. */
export function RachaCorta() {
  const r = useProgreso(() => resumen(), null);
  if (!r || r.dias === 0) return null;
  return (
    <span className="racha-corta">
      <Flame size={16} aria-hidden="true" />
      {r.dias} {r.dias === 1 ? "día" : "días"} seguidos{r.hoy ? "" : " · escucha hoy para no perderla"}
    </span>
  );
}

/** Resumen completo para Mi espacio. */
export function ResumenProgreso() {
  const r = useProgreso(() => resumen(), null);
  if (!r) return <div className="progreso-tarjetas" aria-busy="true" />;
  return (
    <div className="progreso">
      <div className="progreso-tarjetas">
        <div className="progreso-tarjeta progreso-racha">
          <Flame size={28} aria-hidden="true" />
          <span className="progreso-numero">{r.dias}</span>
          <span className="progreso-texto">
            {r.dias === 1 ? "día seguido" : "días seguidos"}
            {r.dias > 0 && !r.hoy ? " · escucha hoy para mantenerla" : ""}
          </span>
        </div>
        <div className="progreso-tarjeta">
          <Headphones size={28} aria-hidden="true" />
          <span className="progreso-numero">{r.total}</span>
          <span className="progreso-texto">audios escuchados</span>
        </div>
      </div>
      <div className="progreso-plan">
        <div className="progreso-plan-cabeza">
          <BookOpen size={20} aria-hidden="true" />
          <span>
            <b>La Biblia en {r.anio}:</b> {r.biblia} de {r.diasAnio} días
          </span>
          <span className="progreso-porcentaje">{r.porcentajeBiblia}%</span>
        </div>
        <div className="progreso-barra" role="progressbar" aria-valuenow={r.porcentajeBiblia} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${Math.max(r.porcentajeBiblia, r.biblia ? 2 : 0)}%` }} />
        </div>
        <p>
          Proverbios: {r.proverbios} · Niños: {r.ninos}. Un audio cuenta al escucharlo casi completo o al tocar “Ya lo
          escuché”.
        </p>
      </div>
    </div>
  );
}
