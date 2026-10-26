#!/usr/bin/env python3
"""Injeta os vetores oficiais da marca EJUP no template e gera a apresentacao."""
import os, shutil
BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
DEST = os.path.join(ROOT, 'EJUP-Experts-Cairo-David.html')
INDEX = os.path.join(ROOT, 'index.html')  # copia — e o nome que Vercel/GitHub Pages servem na raiz

SYMVB  = "214.64 689.54 116.88 116.88"   # simbolo (espiral) — bbox exata
LOCKVB = "212 687 600 123"               # lockup horizontal — bbox exata

sym  = open(os.path.join(BASE, 'symbol_d.txt')).read().strip()
lock = open(os.path.join(BASE, 'lockup_inner.txt')).read().strip()
tpl  = open(os.path.join(BASE, 'template.html')).read()

out = (tpl.replace('__SYMBOL_D__', sym)
          .replace('__SYMVB__', SYMVB)
          .replace('__LOCKVB__', LOCKVB)
          .replace('__LOCKUP__', lock))

for tok in ('__SYMBOL_D__', '__SYMVB__', '__LOCKVB__', '__LOCKUP__'):
    assert tok not in out, 'token nao substituido: ' + tok

open(DEST, 'w').write(out)
shutil.copyfile(DEST, INDEX)
print('gerado:', DEST, len(out), 'bytes')
print('copiado para:', INDEX, '(raiz do site)')
