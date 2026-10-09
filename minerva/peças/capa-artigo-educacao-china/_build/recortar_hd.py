"""Recorte do retrato (BiRefNet retrato + alpha matting). Uso: recortar_hd.py original recorte.png [x0 y0 x1 y1]"""
import sys
from PIL import Image
from rembg import new_session, remove
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
if len(sys.argv) > 3:
    im = im.crop(tuple(int(v) for v in sys.argv[3:7]))
im = im.resize((round(im.width * 2600 / im.height), 2600), Image.LANCZOS)
cut = remove(im, session=new_session("birefnet-portrait"), alpha_matting=True,
             alpha_matting_foreground_threshold=245, alpha_matting_background_threshold=12,
             alpha_matting_erode_size=12)
cut.save(out); print(out, cut.size)
