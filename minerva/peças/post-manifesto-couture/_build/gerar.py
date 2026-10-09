#!/usr/bin/env python3
"""Post manifesto / aspas · Eduardo J. Couture, 1º mandamento do advogado.

Usa o modelo da citação do EJUPcast (peças/citacao-ejupcast), trocando só o
conteúdo e a linha de origem. Depois: python3 _build/render.py
"""
import importlib.util
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
MODELO = HERE.parents[1] / "citacao-ejupcast" / "_build"

spec = importlib.util.spec_from_file_location("citacao", MODELO / "gerar.py")
citacao = importlib.util.module_from_spec(spec)
spec.loader.exec_module(citacao)

POST = {
    "frase": ("Estuda.<br>O Direito se transforma constantemente. Se não acompanhas "
              "seus passos, serás <b>cada dia um pouco menos&nbsp;advogado.</b>"),
    "nome": "Eduardo J. Couture",
    "funcao": "Os Mandamentos do Advogado",
    "origem": "1º mandamento",
}


def main() -> None:
    html = (MODELO / "template.html").read_text(encoding="utf-8")
    troca = {
        "__FONT_FACES__": citacao.fontes(),
        "__SIMBOLO__": citacao.svg("ejup-symbol-navy.svg"),
        "__LOGO__": citacao.svg("ejup-horizontal-navy.svg"),
        "__FRASE__": POST["frase"],
        "__NOME__": POST["nome"],
        "__FUNCAO__": POST["funcao"],
        "__ORIGEM__": POST["origem"],
    }
    for k, v in troca.items():
        if k not in html:
            sys.exit(f"marcador não encontrado no template: {k}")
        html = html.replace(k, v)
    destino = OUT / "post-couture.html"
    destino.write_text(html, encoding="utf-8")
    print(f"gerado: {destino.name}")


if __name__ == "__main__":
    main()
