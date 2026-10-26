import sys, time
from PIL import Image
from rembg import new_session, remove
src, out, model = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert("RGB")
im = im.crop((1595, 120, 5765, 3987))          # busto, sem a mesa
im = im.resize((round(im.width * 2600 / im.height), 2600), Image.LANCZOS)
t = time.time()
s = new_session(model)
cut = remove(im, session=s, alpha_matting=True, alpha_matting_foreground_threshold=245,
             alpha_matting_background_threshold=12, alpha_matting_erode_size=12)
cut.save(out); print(out, cut.size, f"{time.time()-t:.0f}s")
