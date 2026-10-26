# EJUPcast #19 · Marco Bruno · briefing completo para a sessão de edição

Documento autossuficiente para uma sessão do Claude rodando **no computador do
Victor**, onde estão o HD e o DaVinci Resolve. Pedido do Victor em 25/09/2026.

Fontes, se a sessão tiver acesso:
- Repositório: `victorbarrosoc-hub/EJUPMinerva`, branch `claude/ejupminerva-repo-setup-j1rhgg`,
  pasta `docs/formatos/ejupcast-edicao/`.
- Documento de padrão (versão editável): https://claude.ai/code/artifact/bb0d513e-8fcc-4716-868a-bc420fc4e9e0
- Referência da chamada: `docs/formatos/ejupcast-edicao/referencias/ep18-chamada-stories.mp4`.
- Canal do EJUPcast: https://www.youtube.com/watch?v=8CduTDWxKjM

---

## 1. A tarefa

Editar no DaVinci Resolve o episódio 19 do EJUPcast. Convidado: **Marco Bruno**.
Host: **Dra. Rossana Fonseca**.

- Brutos: pasta `Episódio 19 - Marco Bruno`, no HD.
- Projeto base: o projeto do **episódio 18** no DaVinci. Tudo sai dele.

Pedido do Victor, item por item:

1. Sincronizar as câmeras e os áudios do gravador.
2. Cor padrão **sem o Denoiser ativo**. O padrão está no projeto do 18: copiar de lá
   e ajustar o que for preciso para ficar a mesma cor.
3. Tratar o áudio para ficar parecido com o dos episódios já lançados.
4. Vinheta e cortes curtos no começo do episódio, com as transições que já existem.
5. GCs: só o da Dra. Rossana, que já existe. O de Marco Bruno o Victor faz e acrescenta.
6. Corte no padrão dos vídeos anteriores (estudar os episódios publicados).
7. No final, a vinheta de encerramento.
8. Depois dela, a animação com as redes sociais que já está no projeto do 18.
9. Áudio do corte: fica aberto **só quem está falando**. Quem falar por cima entra
   com o corte do áudio dessa pessoa, só naquele trecho.
10. Editar a chamada para stories que o Marco Bruno gravou (está na pasta), no padrão
    da chamada do 18.
11. Ao terminar, preencher no documento de padrão os valores que ficaram pendentes.

Nada é publicado: o episódio passa pelo Roberto Pivotto antes de ir ao ar.

---

## 2. Padrão de edição

### Fluxo
Pasta no HD → projeto base (ep. anterior) → sincronizar câmeras e gravador → corte por
quem fala → abertura e vinhetas → cor copiada sem denoiser → áudio tratado → GCs e
redes sociais → export e revisão. A cor e o áudio só entram com o corte travado.

### Arquivos e projeto base
1. Duplicar o projeto do episódio anterior no DaVinci e renomear para o número novo.
2. Manter as bins de identidade (vinhetas, transições, GCs, animação de redes, trilhas)
   e trocar só a bin de brutos pelos arquivos da pasta nova.
3. Arquivo offline: reapontar com Relink. Não reimportar a identidade.

| Bin | O que tem | Muda por episódio? |
| --- | --- | --- |
| Brutos | Câmeras, gravador, chamada do convidado | Sim |
| Identidade | Vinhetas de abertura e encerramento, transições | Não |
| GCs | GC da Dra. Rossana (fixo), GC do convidado | Só o do convidado |
| Encerramento | Animação com as redes sociais | Não |

### Sincronização
1. Selecionar câmeras e arquivos do gravador → Create New Multicam Clip Using Selected
   Clips, Angle Sync em **Sound**.
2. Conferir em três pontos (início, meio, fim) num som seco. Se houver deriva, dividir
   em blocos e sincronizar cada um.
3. Áudio das câmeras mudo; cada microfone do gravador numa trilha própria, nomeada
   com o nome de quem fala.
4. Câmera que parou e voltou gera ângulo novo, que precisa ser sincronizado de novo.

Regra: uma trilha de áudio por pessoa, do início ao fim.

### Corte
| Ordem | Bloco | Como fazer |
| --- | --- | --- |
| 1 | Abertura com cortes curtos | Trechos fortes do próprio episódio, ligados pelas transições do projeto |
| 2 | Vinheta de abertura | Sem alteração |
| 3 | Conversa | Corte por quem fala; GC da Dra. Rossana na primeira aparição dela; espaço reservado para o GC do convidado |
| 4 | Vinheta de encerramento | A mesma do episódio anterior |
| 5 | Redes sociais | Animação copiada do projeto anterior |

- Câmera: plano de quem fala; em pergunta longa da host, plano de reação.
- Áudio: em cada trilha, mudo tudo o que não é fala daquela pessoa.
- Sobreposição: abrir a trilha de quem interrompe só naquele trecho, fade de 2 a 4 frames.
- Enxugar silêncios longos, repetições e falsos começos, sem cortar no meio de argumento.
- Trocar de câmera por fala; evitar corte a menos de 2 s do anterior, fora da abertura.

### Cor
1. No projeto anterior, Grab Still de um plano de cada câmera.
2. No novo, Apply Grade por ângulo do multicam.
3. **Noise Reduction desligado** (Spatial e Temporal) em todos os nós.
4. Ajustar só exposição e balanço de branco no primeiro nó; o look fica intocado.
5. Comparar em Split Screen com o episódio anterior: pele neutra, madeira quente,
   fundo caindo para o escuro.

### Áudio
- Cadeia do Fairlight copiada da trilha equivalente do episódio anterior.
- Voice Isolation só se o corte por quem fala não resolver o ruído, com pouca intensidade.
- Vozes com volume percebido igual.
- Master: limitador em −1 dBTP, volume final entre −14 e −13 LUFS integrado.
  (A chamada do ep. 18 mede −13,6 LUFS.)

### Grafismos
| Elemento | Onde entra | Quem faz |
| --- | --- | --- |
| Vinheta de abertura | Depois dos cortes curtos | Já existe |
| Transições | Entre os cortes curtos | Já existem |
| GC Dra. Rossana Fonseca | Primeira aparição, ~5 s | Já existe |
| GC do convidado | Primeira aparição dele, mesma posição | Victor (reservar trilha) |
| Vinheta de encerramento | Fim da conversa | Já existe |
| Animação de redes sociais | Depois da vinheta final | Já existe |

Cada grafismo numa trilha de vídeo própria e nomeada, acima do multicam.

### Chamada para stories (medida no arquivo do ep. 18)
| Item | Padrão |
| --- | --- |
| Formato | 1080×1920, 9:16, 23,976 fps, H.264, AAC 48 kHz estéreo |
| Duração | 5,5 s |
| Plano | Único, sem corte, à mesa, madeira em primeiro plano |
| Texto do ep. 18 | "Saiu agora o novo episódio do EJUPcast. O link tá aqui, você vai querer assistir." |
| Legenda | 1 ou 2 palavras por vez, branca, sem caixa, centralizada, ~60% da altura, sombra suave |
| Cor | O grade do episódio |
| Volume | −13,6 LUFS integrado |

### Checklist antes de mandar para o Roberto
- [ ] Sincronia conferida no início, meio e fim
- [ ] Nenhum microfone aberto sem fala; sobreposições sem estalo
- [ ] Cor lado a lado com o episódio anterior, denoiser desligado
- [ ] Volume entre −14 e −13 LUFS, pico −1 dBTP
- [ ] Vinhetas e animação de redes no lugar
- [ ] GC da Dra. Rossana; espaço do GC do convidado reservado
- [ ] Chamada para stories exportada em 1080×1920

### Valores a ler no projeto do episódio 18 e devolver ao documento de padrão
- [ ] Configuração de export (resolução, codec, bitrate)
- [ ] Árvore de nós da cor e LUT, se houver
- [ ] Efeitos e valores da cadeia de áudio de cada trilha
- [ ] Duração e quantidade de cortes curtos na abertura
- [ ] Fonte e tamanho da legenda da chamada para stories
