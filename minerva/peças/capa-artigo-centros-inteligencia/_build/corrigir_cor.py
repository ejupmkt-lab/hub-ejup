"""Correção de cor do recorte da Rossana: brancos neutros, cabelo sem verde."""
import sys
import cv2, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src); a = np.asarray(im.getchannel("A"))
rgb = np.asarray(im.convert("RGB")).astype(np.float32) / 255
lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)          # L 0..100, a/b em torno de 0
L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
def ss(x, e0, e1):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
# 1) brancos e altas luzes: tira o amarelo (b*) e o verde (a*) só onde é claro e pouco saturado
claro = ss(L, 55, 82) * (1 - ss(np.hypot(A, B), 28, 45))
B -= claro * np.clip(B - 2, 0, None) * 0.92
A -= claro * np.clip(A - 0, None, 0) * 0.9
# 2) verde no cabelo e nas sombras: pixels amarelados com a* baixo ganham a* (vão para o dourado)
verde = ss(B, 8, 18) * (1 - ss(A, 4, 12))
A += verde * np.clip(8 - A, 0, None) * 0.75
# 3) sombras esverdeadas/frias (blusa na sombra, gola): neutraliza
sombra = (1 - ss(L, 35, 60)) * (1 - ss(np.hypot(A, B), 18, 30))
A -= sombra * np.clip(A, None, 0) * 0.8
B -= sombra * np.clip(B - 3, 0, None) * 0.6
lab = np.dstack([L, A, B])
rgb2 = np.clip(cv2.cvtColor(lab, cv2.COLOR_LAB2RGB), 0, 1)
# leve ganho de luz e contraste, sem aquecer
rgb2 = np.clip((rgb2 - 0.5) * 1.04 + 0.5 + 0.02, 0, 1)
o = Image.fromarray((rgb2 * 255 + .5).astype(np.uint8)); o.putalpha(Image.fromarray(a))
o.save(out)
