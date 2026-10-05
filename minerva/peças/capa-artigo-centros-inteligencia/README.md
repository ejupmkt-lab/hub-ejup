# Capa · "Centros de Inteligência do Judiciário" (Dra. Rossana Fonseca)

Mesmo sistema da capa do Leonardo ("O poder de polícia ambiental
municipal", `peças/capa-artigo-poder-policia-ambiental/`), que o Victor
apontou em 05/10/2026 como o estilo de foto das divulgações: retrato
recortado, busto no centro, por baixo do texto, dissolvendo no navy com o
halo dourado atrás; logo centralizado embaixo nos verticais.

| arquivo | tamanho | uso |
|---|---|---|
| `capa-horizontal.png` | 1600×900 | site (texto até 471 px; o site mostra 512) |
| `capa-story.png` | 1080×1920 | stories |
| `capa-feed.png` | 1080×1440 | feed |

Também saem as versões `-limpa` (sem retrato e sem logo) e `-bg` (só fundo).

    python3 _build/tratar_foto.py && python3 _build/gerar.py && python3 _build/render.py

**Foto (versão atual):** "Dra. Rossana - Fotos Profissionais-21.jpg" (ensaio
da Panda Design, Drive): de frente, blazer, apoiada na mesa de vidro, olhando
para a câmera. Recortada do topo até antes das mãos (sem a mesa e o reflexo),
com luz +8%, saturação +12% e leve aquecimento. O tamanho do retrato no
horizontal e no story foi reduzido no `template.html` porque esta foto é mais
larga que a do Leonardo.

A foto da estante ("Fotos Profissionais-2") foi reprovada duas vezes: a cor
original deixava a Rossana "como alma penada" e o ângulo, mesmo com cor
corrigida, "parece camisa de saudade". O histórico abaixo é dela.

**Foto anterior:** "Dra. Rossana - Fotos Profissionais-2.jpg", a da estante de livros. Recorte com rembg (modelo isnet-general-use);
`foto.png` fica fora do versionamento, `_build/foto-tratada.webp` é o que vai
embutido. O ensaio corta a manga direita na borda, então a lateral que encosta
na borda é esfumada (`FADE_DIR`, 10%). Boca fechada.

**Tratamento de cor (05/10/2026):** a primeira versão, com a cor original do
ensaio (fria, dessaturada, luz lateral), foi reprovada: "parecendo uma alma
penada". O recorte agora recebe luz +14%, saturação +22%, contraste +6% e um
leve aquecimento (vermelho +4%, azul -5%) antes de entrar na capa, e o
esfumado lateral caiu de 16% para 10%. Testei também o close frontal de blazer
("Fotos Profissionais-15"): ficou só o rosto, grande demais, e foi descartado.

**Aprovada pelo Victor (05/10/2026):** a foto de frente, de blazer, na mesa.
Cargo confirmado por ele: "Advogada e sócia da EJUP".

**A confirmar:** a categoria "Gestão judiciária".
