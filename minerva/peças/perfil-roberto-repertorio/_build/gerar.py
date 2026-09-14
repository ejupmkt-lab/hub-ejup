#!/usr/bin/env python3
"""Modelo do carrossel do perfil pessoal de Roberto Pivotto.

Cinco telas 1080×1350, cada uma com **dois quadros empilhados**, no formato da
referência guardada em `docs/referencias/vontade-de-aprender-tudo/`: a fala
corre por cima da imagem, uma linha por quadro, legenda amarela com contorno.

O arquivo gerado abre no navegador sem servidor. Cada quadro é um slot de
foto: arraste a imagem para dentro, reposicione arrastando e ajuste o zoom.
O texto também é editável no próprio quadro, para trocar as lacunas pelas
frases que o Roberto disser na entrevista.
"""

import base64
import html as _html
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"

FACES = [("Gotham-Light.otf", 300), ("Gotham-Medium.otf", 500),
         ("Gotham-Bold.otf", 700), ("Gotham-Black.otf", 900)]

# dez quadros, dois por tela. Colchete = lacuna a preencher com a fala dele.
QUADROS = [
    "Eu nunca consegui estudar uma coisa só.",
    "[assunto 1], [assunto 2], [assunto 3]. E Direito.",
    "Me ensinaram cedo que profissional sério escolhe uma coisa",
    "e fecha o resto.",
    "Quem fecha o resto fica com uma ferramenta só.",
    "E problema de cliente não chega dividido por matéria.",
    "[o que veio de fora: o livro, a viagem, o outro ofício]",
    "[e o problema jurídico que aquilo resolveu]",
    "Curiosidade sem profundidade é passatempo.",
    "Quero aprender de tudo. E continuar sendo o melhor em [a sua coisa].",
]

# sugestão de imagem por quadro, aparece no slot vazio
DICAS = [
    "rosto, plano fechado, estante atrás",
    "três cortes rápidos do acervo dele",
    "rosto, plano um pouco mais aberto",
    "mesa de trabalho, processo, tela",
    "detalhe de uma ferramenta só, objeto isolado",
    "reunião ou atendimento, pessoas na mesa",
    "o material do caso: lugar, obra, documento",
    "ele em situação de trabalho",
    "rosto, sem corte, a frase mais dura",
    "rosto, meio sorriso, corte seco",
]


def fontes() -> str:
    out = []
    for nome, peso in FACES:
        src = FONTS / nome
        if not src.exists():
            sys.exit(f"fonte ausente: {src}")
        b64 = base64.b64encode(src.read_bytes()).decode("ascii")
        out.append("@font-face{font-family:'Gotham';font-style:normal;"
                   f"font-weight:{peso};"
                   f"src:url(data:font/otf;base64,{b64}) format('opentype');}}")
    return "\n".join(out)


def main() -> None:
    html = (HERE / "template.html").read_text(encoding="utf-8")
    dados = json.dumps([{"texto": t, "dica": d}
                        for t, d in zip(QUADROS, DICAS)], ensure_ascii=False)
    for marca, valor in (("__FONT_FACES__", fontes()), ("__QUADROS__", dados)):
        if marca not in html:
            sys.exit(f"marcador ausente: {marca}")
        html = html.replace(marca, valor)
    destino = OUT / "modelo-perfil-roberto.html"
    destino.write_text(html, encoding="utf-8")
    print(f"gerado: {destino.name} ({destino.stat().st_size/1024:.0f} KB), "
          f"{len(QUADROS)//2} telas")


if __name__ == "__main__":
    main()
