"use client";

import { Heart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { escucharFavoritos, leerFavoritos, quitarFavorito, type Favorito } from "@/lib/favoritos";
import { fechaCorta } from "@/lib/fechas";
import { SERIES } from "@/lib/sitio";

export function ListaFavoritos() {
  const [lista, setLista] = useState<Favorito[] | null>(null);

  useEffect(() => {
    const leer = () => setLista(leerFavoritos());
    leer();
    return escucharFavoritos(leer);
  }, []);

  if (lista === null) return <div className="vacio" aria-busy="true">Cargando tus favoritos…</div>;
  if (!lista.length)
    return (
      <div className="vacio favoritos-vacio">
        <Heart size={36} aria-hidden="true" />
        <p>
          Aún no tienes audios guardados. Toca <b>Guardar</b> en cualquier audio para tenerlo aquí a la mano.
        </p>
        <Link className="boton boton-oscuro" href="/">
          Ver los audios de hoy
        </Link>
      </div>
    );

  return (
    <ul className="lista-favoritos">
      {lista.map((f) => (
        <li key={f.slug}>
          <Link href={`/${f.serie}/${f.slug}`} className="favorito">
            <span className="favorito-imagen">
              <Image src={f.miniatura} alt="" fill sizes="120px" />
            </span>
            <span>
              <span className="tarjeta-fecha">
                {fechaCorta(f.fecha)} · {SERIES[f.serie].corto}
              </span>
              <span className="favorito-titulo">{f.lectura}</span>
            </span>
          </Link>
          <button type="button" className="favorito-quitar" onClick={() => quitarFavorito(f.slug)} aria-label={`Quitar ${f.lectura} de favoritos`}>
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
