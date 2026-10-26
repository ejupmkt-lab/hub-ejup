# hub-ejup

Repositório principal da EJUP. Cada projeto vive na sua própria pasta, com o histórico de commits original preservado.

| Pasta | Projeto | Origem |
|---|---|---|
| [`sistema-de-gestao/`](sistema-de-gestao) | Sistema de gestão (Next.js + Supabase) | `ejupmkt-lab/sistema-de-gest-o` |
| [`experts/`](experts) | Página de apresentação Experts | `ejupmkt-lab/experts` |
| [`minerva/`](minerva) | EJUP Minerva (peças, skills e conteúdo) | `victorbarrosoc-hub/EJUPMinerva`, branch `claude/ejupminerva-repo-setup-j1rhgg` |

## Deploy na Vercel

Cada projeto da Vercel aponta para este repositório e define o **Root Directory** como a pasta do projeto (ex.: `sistema-de-gestao`).

## Mídia do Minerva (Git LFS)

Imagens, vídeos, áudios, PDFs e ZIPs de `minerva/` ficam no Git LFS. Instale o LFS antes de clonar (`git lfs install`) para baixar os arquivos reais.
O histórico de commits do Minerva foi preservado para código e textos; versões antigas da mídia continuam apenas no repositório original.
