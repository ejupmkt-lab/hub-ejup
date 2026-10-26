#!/usr/bin/env python3
"""Gera o protótipo publicável (artifact) do círculo da Minerva.

Mesmo desenho e mesma conversa da versão local, com duas trocas para caber
no sandbox do claude.ai: o cérebro é a capacidade `sample` (a conta Claude de
quem abre a página) e a voz é a síntese de fala do próprio navegador, já que
o ElevenLabs só entra pelo servidor local. Tem ainda um modo demonstração,
para avaliar o design sem gastar nada."""
import base64
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
KB = RAIZ / "docs" / "minerva" / "base-de-conhecimento.md"

FACES = [("Gotham-Light.otf", 300), ("Gotham-Medium.otf", 500), ("Gotham-Black.otf", 900)]


def fontes() -> str:
    out = []
    for nome, peso in FACES:
        b64 = base64.b64encode((FONTS / nome).read_bytes()).decode("ascii")
        out.append("@font-face{font-family:'Gotham';font-weight:%d;font-display:swap;"
                   "src:url(data:font/otf;base64,%s) format('opentype')}" % (peso, b64))
    return "\n".join(out)


def main() -> None:
    html = (HERE / "prototipo.template.html").read_text(encoding="utf-8")
    kb = KB.read_text(encoding="utf-8")
    kb = kb.split("---", 1)[1].strip() if "---" in kb else kb
    for marca, valor in (("__FONTS__", fontes()), ("__KB__", json.dumps(kb, ensure_ascii=False))):
        if marca not in html:
            sys.exit(f"marcador ausente: {marca}")
        html = html.replace(marca, valor)
    destino = OUT / "prototipo.html"
    destino.write_text(html, encoding="utf-8")
    print(f"gerado: {destino.name} ({destino.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
