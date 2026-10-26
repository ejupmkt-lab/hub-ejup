# hub-ejup

Repositório principal da EJUP. Cada projeto vive na sua própria pasta, com o histórico de commits original preservado.

| Pasta | Projeto | Origem |
|---|---|---|
| [`sistema-de-gestao/`](sistema-de-gestao) | Sistema de gestão (Next.js + Supabase) | `ejupmkt-lab/sistema-de-gest-o` |
| [`ejup-site/`](ejup-site) | Site da EJUP (projeto `ejup-site` na Vercel) | `victorbarrosoc-hub/EJUPMinerva`, pasta `site/` da branch `claude/tender-allen-jzf0ro` |
| [`minerva/`](minerva) | EJUP Minerva (peças, skills e conteúdo) | `victorbarrosoc-hub/EJUPMinerva`, branch `claude/ejupminerva-repo-setup-j1rhgg` |
| [`roberto-pivotto/`](roberto-pivotto) | Marca pessoal do Roberto Pivotto (método, planner, pautas e roteiros) | `victorbarrosoc-hub/RobertoPivotto`, recuperado do site publicado |

O projeto **Experts** continua no seu próprio repositório: [`ejupmkt-lab/experts`](https://github.com/ejupmkt-lab/experts).

## Deploy na Vercel

Cada projeto da Vercel aponta para este repositório e define o **Root Directory** como a pasta do projeto (ex.: `sistema-de-gestao`).

| Projeto na Vercel | Root Directory |
|---|---|
| `sistema-de-gestao` | `sistema-de-gestao` |
| `ejup-site` | `ejup-site` |

Cada projeto usa o *Ignored Build Step* `git diff --quiet HEAD^ HEAD -- .`, então só faz deploy quando algo muda na sua própria pasta.

## Mídia do Minerva (Git LFS)

Imagens, vídeos, áudios, PDFs e ZIPs de `minerva/` ficam no Git LFS. Instale o LFS antes de clonar (`git lfs install`) para baixar os arquivos reais.
O histórico de commits do Minerva foi preservado para código e textos; versões antigas da mídia continuam apenas no repositório original.
