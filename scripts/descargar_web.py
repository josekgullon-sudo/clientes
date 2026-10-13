"""
Descarga una página oficial como texto a /fuentes/microsoft/<slug>.txt (ofimática) o, con un
cuarto argumento, a /fuentes/<carpeta>/<slug>.txt (p. ej. «web» para transparencia.gob.es o la ONU).

  python3 scripts/descargar_web.py URL slug "Título" [carpeta]

La segunda línea guarda la URL: es la que va en el campo `fuente` de cada pregunta, y así
`npm run preguntas:citas` sabe contra qué texto comprobar sus citas.
"""
import html
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path


def main() -> None:
    url, slug, titulo = sys.argv[1], sys.argv[2], sys.argv[3]
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "es-ES"})
    with urllib.request.urlopen(req, timeout=60) as r:
        crudo = r.read().decode("utf-8", "replace")
    cuerpo = re.search(r"<(main|article)\b.*?</\1>", crudo, re.S)
    texto = cuerpo.group(0) if cuerpo else crudo
    texto = re.sub(r"<(script|style|nav|footer|header)\b.*?</\1>", "", texto, flags=re.S)
    texto = re.sub(r"</(p|li|h[1-6]|tr|div|td|th)>|<br\s*/?>", "\n", texto)
    texto = html.unescape(re.sub(r"<[^>]+>", " ", texto))
    lineas = [re.sub(r"[ \t ]+", " ", l).strip() for l in texto.split("\n")]
    lineas = [l for l in lineas if l]
    cabecera = [titulo, url, f"Descargado: {date.today().isoformat()}", ""]
    carpeta = sys.argv[4] if len(sys.argv) > 4 else "microsoft"
    destino = Path(__file__).resolve().parent.parent / "fuentes" / carpeta / f"{slug}.txt"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text("\n".join(cabecera + lineas) + "\n", encoding="utf-8")
    print(f"{destino.name}: {len(lineas)} líneas")


if __name__ == "__main__":
    main()
