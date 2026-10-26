#!/usr/bin/env python3
"""Monta a página da Minerva: fontes Gotham em base64, símbolo em SVG e a
base de conhecimento (docs/minerva/base-de-conhecimento.md) injetados no
template. Saída: ../minerva.html, pronta para publicar como artifact."""
import base64
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
KB = RAIZ / "docs" / "minerva" / "base-de-conhecimento.md"

FACES = [("Gotham-Light.otf", 300), ("Gotham-Book.otf", 400),
         ("Gotham-Medium.otf", 500), ("Gotham-Black.otf", 900)]


def fontes() -> str:
    out = []
    for nome, peso in FACES:
        src = FONTS / nome
        if not src.exists():
            sys.exit(f"fonte ausente: {src}")
        b64 = base64.b64encode(src.read_bytes()).decode("ascii")
        out.append("@font-face{font-family:'Gotham';font-style:normal;"
                   f"font-weight:{peso};font-display:swap;"
                   f"src:url(data:font/otf;base64,{b64}) format('opentype');}}")
    return "\n".join(out)


def main() -> None:
    html = (HERE / "template.html").read_text(encoding="utf-8")
    kb = KB.read_text(encoding="utf-8")
    # o cabeçalho de manutenção do arquivo não vai para a assistente
    kb = kb.split("---", 1)[1].strip() if "---" in kb else kb
    if len(kb.encode("utf-8")) > 32000:
        sys.exit("base de conhecimento acima de 32 KB; enxugue antes")
    simbolo = (LOGOS / "ejup-symbol-gold.svg").read_text(encoding="utf-8")
    for marca, valor in (("__FONTS__", fontes()),
                         ("__KB__", json.dumps(kb, ensure_ascii=False)),
                         ("__SIMBOLO__", simbolo)):
        if marca not in html:
            sys.exit(f"marcador ausente: {marca}")
        html = html.replace(marca, valor)
    destino = OUT / "minerva.html"
    destino.write_text(html, encoding="utf-8")
    print(f"gerado: {destino.name} ({destino.stat().st_size/1024:.0f} KB), "
          f"base de {len(kb.encode('utf-8'))/1024:.1f} KB")


if __name__ == "__main__":
    main()
