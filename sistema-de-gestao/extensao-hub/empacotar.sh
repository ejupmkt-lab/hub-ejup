#!/bin/bash
# Gera public/blimp-hub-extensao.zip (o arquivo que o Blimp oferece para baixar). Rode depois de mudar a extensão.
cd "$(dirname "$0")/.." || exit 1
python3 - <<'PY'
import zipfile, os
destino = "public/blimp-hub-extensao.zip"
with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
    for nome in ["manifest.json", "fundo.js", "popup.html", "popup.js", "opcoes.html", "opcoes.js", "LEIAME.txt"]:
        z.write(os.path.join("extensao-hub", nome), f"blimp-hub-extensao/{nome}")
print("gerado", destino)
PY
