#!/usr/bin/env python3
"""Prepara os quadros das pranchas para a animação em código.

1. Real-ESRGAN x4 (pesos abertos, roda na CPU): fonte/NN.png -> up/NN.png
2. Depth Anything V2 Small: up/NN.png -> profundidade/NN.png (claro = perto)

Quando houver versões em alta (Higgsfield), basta colocá-las em up/ com o
mesmo nome: a profundidade é recalculada e a animação refeita sem mudar nada.
Uso: python3 preparar_telas.py 01 02 03 ...  (sem argumentos: todas)
"""
import pathlib, sys
import numpy as np
import torch
from PIL import Image

BASE = pathlib.Path(__file__).resolve().parent.parent / "telas-codigo"
PESOS = pathlib.Path("/root/modelos/RealESRGAN_x4plus.pth")
torch.set_num_threads(4)


def upscale(nomes):
    from spandrel import ModelLoader
    modelo = ModelLoader().load_from_file(str(PESOS)).eval()
    for n in nomes:
        dst = BASE / "up" / f"{n}.png"
        if dst.exists():
            continue
        im = np.asarray(Image.open(BASE / "fonte" / f"{n}.png").convert("RGB")).astype(np.float32) / 255
        x = torch.from_numpy(im).permute(2, 0, 1)[None]
        with torch.no_grad():
            y = modelo(x)[0].clamp(0, 1).permute(1, 2, 0).numpy()
        Image.fromarray((y * 255).round().astype(np.uint8)).save(dst)
        print("up", n, y.shape[1], "x", y.shape[0], flush=True)


def profundidade(nomes):
    from transformers import pipeline
    est = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device=-1)
    for n in nomes:
        dst = BASE / "profundidade" / f"{n}.png"
        if dst.exists():
            continue
        im = Image.open(BASE / "up" / f"{n}.png").convert("RGB")
        d = np.asarray(est(im)["depth"].resize(im.size, Image.BICUBIC)).astype(np.float32)
        d = (d - d.min()) / max(1e-6, d.max() - d.min())
        Image.fromarray((d * 255).astype(np.uint8)).save(dst)
        print("prof", n, flush=True)


if __name__ == "__main__":
    nomes = sys.argv[1:] or sorted(p.stem for p in (BASE / "fonte").glob("*.png"))
    for d in ("up", "profundidade"):
        (BASE / d).mkdir(exist_ok=True)
    upscale(nomes)
    profundidade(nomes)
