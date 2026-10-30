"""Convierte SpaRV.json (Reina-Valera 1909, dominio público, de scrollmapper/bible_databases)
en un archivo ligero por libro para la página: web/data/rv1909/01.json … 66.json

    python3 -I scripts/preparar_biblia.py descargas_drive/biblia/SpaRV.json

Cada archivo: {"c": [[versículo1, versículo2, …], …]} (un arreglo por capítulo)."""
import json
import re
import sys
from pathlib import Path

DESTINO = Path(__file__).resolve().parent.parent / "web" / "data" / "rv1909"
NO_TOCAR = {"JEHOVÁ", "DIOS", "SEÑOR", "JESÚS"}  # mayúsculas propias de la traducción


def limpiar_inicio(texto):
    """La 1909 abre cada capítulo con la primera palabra en mayúsculas ("EN el principio")."""
    # También "Y ACAECIÓ…" / "Y DIJO…": una letra suelta y luego la palabra en mayúsculas.
    m = re.match(r"^([A-ZÁÉÍÓÚÑ] )?([A-ZÁÉÍÓÚÑÜ]{2,})(\b.*)", texto)
    if not m or m.group(2) in NO_TOCAR:
        return texto
    palabra = m.group(2).lower() if m.group(1) else m.group(2).capitalize()
    return (m.group(1) or "") + palabra + m.group(3)


def main(origen):
    datos = json.loads(Path(origen).read_text(encoding="utf-8"))
    assert "1909" in datos["translation"], datos["translation"]
    libros = datos["books"]
    assert len(libros) == 66
    DESTINO.mkdir(parents=True, exist_ok=True)
    total = 0
    for i, libro in enumerate(libros, 1):
        capitulos = []
        for cap in libro["chapters"]:
            versos = [" ".join(v["text"].split()) for v in sorted(cap["verses"], key=lambda v: v["verse"])]
            if versos:
                versos[0] = limpiar_inicio(versos[0])
            capitulos.append(versos)
            total += len(versos)
        (DESTINO / f"{i:02d}.json").write_text(json.dumps({"c": capitulos}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (DESTINO / "LEEME.txt").write_text(
        "La Santa Biblia Reina-Valera (1909). Dominio público.\n"
        "Fuente: scrollmapper/bible_databases (formats/json/SpaRV.json), licencia MIT.\n"
        "Generado con scripts/preparar_biblia.py. Un archivo por libro en orden canónico (01 Génesis … 66 Apocalipsis).\n",
        encoding="utf-8",
    )
    print(f"{len(libros)} libros, {total} versículos → {DESTINO}")


if __name__ == "__main__":
    main(sys.argv[1])
