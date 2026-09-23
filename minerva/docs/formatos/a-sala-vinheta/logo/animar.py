#!/usr/bin/env python3
"""Logo A animado (5 s, 1920x1080, 24 fps).
0,0 a 0,9 s moldura se desenha · 0,5 a 1,5 s nome entra fechando o espaçamento ·
1,5 s alfinetes · 1,6 a 2,4 s fio dourado de um alfinete ao outro · até 5 s parado.
Sai em chroma verde (MP4) e com canal alfa (ProRes 4444 .mov)."""
import base64, pathlib, subprocess, shutil, imageio_ffmpeg
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
FON = HERE.parents[3] / "skills" / "ejup-design" / "assets" / "fonts"
light = base64.b64encode((FON / "Gotham-Light.otf").read_bytes()).decode()
FPS, DUR, W, H = 24, 5.0, 1920, 1080
FF = imageio_ffmpeg.get_ffmpeg_exe()

def html(fundo):
    return f"""<html><head><style>
@font-face{{font-family:G;font-weight:300;src:url(data:font/otf;base64,{light})}}
*{{margin:0}} body{{width:{W}px;height:{H}px;background:{fundo};display:flex;align-items:center;justify-content:center}}
svg{{width:1500px;overflow:visible}}
.aro{{stroke-dasharray:2200;stroke-dashoffset:2200;animation:des .9s cubic-bezier(.16,1,.3,1) 0s forwards}}
.nome{{opacity:0;letter-spacing:70px;animation:nome 1s cubic-bezier(.16,1,.3,1) .5s forwards}}
.fio{{stroke-dasharray:800;stroke-dashoffset:800;animation:des .8s cubic-bezier(.65,0,.35,1) 1.6s forwards}}
.pino{{opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(0);animation:pino .36s cubic-bezier(.16,1,.3,1) forwards}}
@keyframes des{{to{{stroke-dashoffset:0}}}}
@keyframes nome{{to{{opacity:1;letter-spacing:38px}}}}
@keyframes pino{{to{{opacity:1;transform:scale(1)}}}}
</style></head><body>
<svg viewBox="0 0 900 360">
  <defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="360">
    <rect width="900" height="360" fill="#fff"/>
    <text x="450" y="212" text-anchor="middle" font-family="G" font-weight="300" font-size="92" letter-spacing="38"
      fill="#000" stroke="#000" stroke-width="34" stroke-linejoin="round">A SALA</text></mask></defs>
  <rect class="aro" x="40" y="40" width="820" height="280" fill="none" stroke="#d1d3d4" stroke-width="2"/>
  <g mask="url(#m)"><line class="fio" x1="70" y1="292" x2="830" y2="68" stroke="#f0b855" stroke-width="2"/></g>
  <circle class="pino" style="animation-delay:1.45s" cx="70" cy="292" r="7" fill="#f0b855"/>
  <circle class="pino" style="animation-delay:2.3s" cx="830" cy="68" r="7" fill="#f0b855"/>
  <text class="nome" x="450" y="212" text-anchor="middle" font-family="G" font-weight="300" font-size="92" fill="#fff">A SALA</text>
</svg></body></html>"""

def render(pasta, fundo, alfa):
    if pasta.exists(): shutil.rmtree(pasta)
    pasta.mkdir()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": W, "height": H})
        pg.set_content(html(fundo)); pg.wait_for_timeout(400)
        pg.evaluate("document.getAnimations().forEach(a=>a.pause())")
        for i in range(int(FPS * DUR)):
            t = i * 1000 / FPS
            pg.evaluate(f"document.getAnimations().forEach(a=>a.currentTime={t})")
            pg.screenshot(path=str(pasta / f"f{i:04d}.png"), omit_background=alfa)
        b.close()

verde, alfa = HERE / "_quadros_verde", HERE / "_quadros_alfa"
render(verde, "#00b140", False)
render(alfa, "transparent", True)
subprocess.run([FF, "-y", "-v", "error", "-framerate", str(FPS), "-i", str(verde / "f%04d.png"),
                "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                str(HERE / "a-sala-logo-animado-chroma.mp4")], check=True)
subprocess.run([FF, "-y", "-v", "error", "-framerate", str(FPS), "-i", str(alfa / "f%04d.png"),
                "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le",
                str(HERE / "a-sala-logo-animado-alfa.mov")], check=True)
shutil.rmtree(verde); shutil.rmtree(alfa)
print("ok")
