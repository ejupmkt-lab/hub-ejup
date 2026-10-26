# Roberto Pivotto · marca pessoal

Conteúdo do perfil pessoal do Roberto Pivotto (Instagram e LinkedIn): método, planner, pautas semanais e roteiros.

| Pasta | O que tem |
|---|---|
| `apresentacao/` | O site estático: livro de modelos (`/livro`), proposta e quadros antigos, roteiros, planner e pautas |
| `design-system/` | Método de roteiro (`07`), voz (`voice.md`) e os geradores em `roteiros/` |
| `fontes/` | Os PDFs que vão para o Roberto |

## Como gerar

```sh
python3 design-system/roteiros/pautas.py 2026-10-26        # pauta da semana, a partir de pautas/<data>.json
python3 design-system/roteiros/planner.py                  # planner semanal
python3 design-system/roteiros/videos/build.py             # roteiros com investigação (videos.json)
node design-system/roteiros/pdf.mjs pauta 2026-10-26       # PDFs em fontes/
node design-system/roteiros/pdf.mjs planner
node design-system/roteiros/pdf.mjs videos 3A 3B 4
```

## Como trabalhar

1. Toda peça começa pela investigação (`design-system/07-metodo-de-roteiro.md`): tese, fatos com fonte, hipóteses, mecanismo, limites.
2. Sem quadros fixos. Vídeos caseiros, sem lettering.
3. ⚑ marca o que depende do Roberto antes de publicar.

## Origem

Migrado em 26/10/2026 do repositório `victorbarrosoc-hub/RobertoPivotto`, que deixou de estar acessível. O `apresentacao/` veio do site publicado (roberto-pivotto.vercel.app); os geradores e o método foram reconstruídos a partir do histórico de trabalho. Os documentos 01 a 06 do manual não foram recuperados como texto; o conteúdo visual deles está no livro de modelos.
