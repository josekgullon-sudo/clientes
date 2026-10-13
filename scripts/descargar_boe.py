"""
Descarga el texto consolidado de una norma del BOE (API de datos abiertos) a /fuentes,
con el mismo formato que el resto de fuentes: cabecera con la fecha de actualización y un
párrafo por línea, con los encabezados «Artículo N. Título.» en su propia línea.

  python3 scripts/descargar_boe.py BOE-A-2013-12887 ley-19-2013 "Ley 19/2013, de 9 de diciembre, de transparencia..."

De cada bloque toma solo la última versión (la vigente).
"""
import html
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

API = "https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/{id}/{que}"


def pedir(id_norma: str, que: str) -> str:
    req = urllib.request.Request(API.format(id=id_norma, que=que), headers={"Accept": "application/xml"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def limpiar(fragmento: str) -> str:
    texto = re.sub(r"<br\s*/?>", " ", fragmento)
    texto = re.sub(r"<[^>]+>", "", texto)
    return re.sub(r"\s+", " ", html.unescape(texto)).strip()


def main() -> None:
    id_norma, slug, titulo = sys.argv[1], sys.argv[2], sys.argv[3]
    meta = pedir(id_norma, "metadatos")
    actualizada = re.search(r"<fecha_actualizacion>(\d{4})(\d{2})(\d{2})", meta)
    fecha = f"{actualizada[1]}-{actualizada[2]}-{actualizada[3]}" if actualizada else "desconocida"

    xml = pedir(id_norma, "texto")
    lineas: list[str] = []
    for bloque in re.findall(r"<bloque\b[^>]*>(.*?)</bloque>", xml, re.S):
        versiones = re.findall(r"<version\b[^>]*>(.*?)</version>", bloque, re.S)
        if not versiones:
            continue
        for clase, contenido in re.findall(r'<p class="([^"]+)"[^>]*>(.*?)</p>', versiones[-1], re.S):
            t = limpiar(contenido)
            if not t:
                continue
            if clase in ("articulo", "titulo_num", "capitulo_num", "seccion", "centro_redonda") and lineas:
                lineas.append("")
            lineas.append(t)

    cabecera = [
        titulo,
        f"Texto consolidado del BOE ({id_norma}): https://www.boe.es/buscar/act.php?id={id_norma}",
        f"Última actualización del texto consolidado: {fecha}",
        f"Descargado: {date.today().isoformat()} vía API de datos abiertos del BOE.",
        "",
    ]
    destino = Path(__file__).resolve().parent.parent / "fuentes" / f"{slug}.txt"
    destino.write_text("\n".join(cabecera + lineas) + "\n", encoding="utf-8")
    print(f"{destino.name}: {len(lineas)} líneas, actualizado {fecha}")


if __name__ == "__main__":
    main()
