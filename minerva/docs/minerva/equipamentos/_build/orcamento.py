#!/usr/bin/env python3
"""Planilha de orçamento dos equipamentos de produção da EJUP.

Os itens e preços médios ficam em ITENS (preenchidos com a pesquisa de
09/10/2026). Quantidade e preço são entradas (azul); subtotal e totais são
fórmulas. Rodar e depois recalcular com o recalc.py da skill xlsx.
"""
import pathlib
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment

OUT = pathlib.Path(__file__).resolve().parents[1] / "Orcamento_Equipamentos_EJUP.xlsx"

# (categoria, item, qtd, preço médio unitário, onde comprar, link, observação)
ITENS = []  # preenchido abaixo
LOJAS = []  # (loja, para quê, observação)

from dados import ITENS, LOJAS, DATA, NOTA  # noqa: E402

AZUL = Font(name="Arial", size=10, color="0000FF")
PRETO = Font(name="Arial", size=10)
NEG = Font(name="Arial", size=10, bold=True)
TIT = Font(name="Arial", size=14, bold=True, color="031C37")
CAB = Font(name="Arial", size=10, bold=True, color="FFFFFF")
FUNDO_CAB = PatternFill("solid", fgColor="031C37")
FUNDO_CAT = PatternFill("solid", fgColor="E9EDF2")
FUNDO_TOT = PatternFill("solid", fgColor="F6EFD9")
FINO = Side(style="thin", color="C8CDD3")
BORDA = Border(bottom=FINO)
MOEDA = 'R$ #,##0;-R$ #,##0;"-"'

wb = Workbook()
ws = wb.active
ws.title = "Orçamento"
ws["A1"] = "Orçamento de equipamentos · produção EJUP"
ws["A1"].font = TIT
ws["A2"] = f"Preços médios de lojas brasileiras, pesquisados em {DATA}. {NOTA}"
ws["A2"].font = Font(name="Arial", size=9, italic=True, color="5F6062")
ws["A3"] = "Azul: quantidade e preço, que podem ser editados. Preto: fórmulas."
ws["A3"].font = Font(name="Arial", size=9, color="5F6062")

cab = ["Categoria", "Item", "Qtd", "Preço médio (R$)", "Subtotal (R$)", "Onde comprar", "Link", "Observação"]
for c, t in enumerate(cab, 1):
    cel = ws.cell(row=5, column=c, value=t)
    cel.font, cel.fill = CAB, FUNDO_CAB
    cel.alignment = Alignment(vertical="center", wrap_text=True)

lin = 6
cats = []
for cat, item, qtd, preco, onde, link, obs in ITENS:
    if cat not in cats:
        cats.append(cat)
    ws.cell(row=lin, column=1, value=cat).font = PRETO
    ws.cell(row=lin, column=2, value=item).font = PRETO
    ws.cell(row=lin, column=3, value=qtd).font = AZUL
    p = ws.cell(row=lin, column=4, value=preco)
    p.font, p.number_format = AZUL, MOEDA
    s = ws.cell(row=lin, column=5, value=f"=C{lin}*D{lin}")
    s.font, s.number_format = PRETO, MOEDA
    ws.cell(row=lin, column=6, value=onde).font = PRETO
    if link:
        l = ws.cell(row=lin, column=7, value=link)
        l.hyperlink = link
        l.font = Font(name="Arial", size=10, color="304557", underline="single")
    ws.cell(row=lin, column=8, value=obs).font = PRETO
    for c in range(1, 9):
        ws.cell(row=lin, column=c).border = BORDA
        ws.cell(row=lin, column=c).alignment = Alignment(vertical="top", wrap_text=True)
    lin += 1
ult = lin - 1

lin += 1
ws.cell(row=lin, column=1, value="Total por categoria").font = NEG
lin += 1
for cat in cats:
    ws.cell(row=lin, column=2, value=cat).font = PRETO
    t = ws.cell(row=lin, column=5, value=f'=SUMIF($A$6:$A${ult},B{lin},$E$6:$E${ult})')
    t.font, t.number_format = PRETO, MOEDA
    for c in range(1, 9):
        ws.cell(row=lin, column=c).fill = FUNDO_CAT
    lin += 1
ws.cell(row=lin, column=2, value="TOTAL GERAL").font = NEG
tg = ws.cell(row=lin, column=5, value=f"=SUM(E6:E{ult})")
tg.font, tg.number_format = NEG, MOEDA
for c in range(1, 9):
    ws.cell(row=lin, column=c).fill = FUNDO_TOT

for col, w in zip("ABCDEFGH", (16, 46, 6, 16, 16, 30, 46, 52)):
    ws.column_dimensions[col].width = w
ws.freeze_panes = "A6"

# aba das lojas
wl = wb.create_sheet("Onde comprar")
wl["A1"] = "Onde comprar"
wl["A1"].font = TIT
for c, t in enumerate(["Loja", "Para quê", "Observação"], 1):
    cel = wl.cell(row=3, column=c, value=t)
    cel.font, cel.fill = CAB, FUNDO_CAB
for i, (loja, para, obs) in enumerate(LOJAS, 4):
    for c, v in enumerate((loja, para, obs), 1):
        cel = wl.cell(row=i, column=c, value=v)
        cel.font = PRETO
        cel.alignment = Alignment(vertical="top", wrap_text=True)
        cel.border = BORDA
for col, w in zip("ABC", (30, 40, 70)):
    wl.column_dimensions[col].width = w

wb.save(OUT)
print(OUT)
