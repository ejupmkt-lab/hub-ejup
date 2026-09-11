# Blueprint — Company Paperclip dedicada a Maria Helena Cortez

> Direção do board (EJUA-183, 2026-07-23): criar **outra company no Paperclip** (não no ClickUp),
> um **fluxo de agentes próprio, fora da área do squad EJUP**, para dar vazão à produção de
> conteúdo da MH. Este documento substitui, para a Camada 3 (marca pessoal), a recomendação
> anterior de "subagente único + área ClickUp". Fonte de DNA/voz continua sendo
> `maria-helena-board-pessoal-orientacoes.md`.

## 0. Restrição técnica que define quem faz o quê

Testei a API do Paperclip nesta run:

- `POST /api/companies` com nome válido → **`Board access required`**.
  **Agentes não criam companies.** A criação da company é ação de **board (você), na UI do Paperclip.**
- `POST /api/companies/{companyId}/agents` → permitido (é assim que os agentes do squad EJUP existem).
  Ou seja: **depois** que a company existir, a população de agentes pode ser automatizada —
  desde que eu tenha acesso àquela company, ou que você semeie o primeiro agente (o Diretor) lá dentro.

**Conclusão operacional:** a montagem é um handoff em 2 passos —
(1) você cria a company vazia na UI; (2) eu (ou o Diretor semeado nela) populo o fluxo de agentes.

## 1. Identidade da company (parâmetros — o prefixo é imutável, então decida agora)

| Campo | Proposto | Observação |
|---|---|---|
| Nome | **Estúdio Maria Helena Cortez** | ajustável |
| Prefixo de issue | **MHC** | **imutável depois de criado** — confirme antes |
| Board interlocutor | Leonardo / você | mesmo padrão do EJUP |
| Isolamento | total do EJUP | atende ao "fora da área desses agentes" |
| Fonte de verdade de marca | `maria-helena-board-pessoal-orientacoes.md` (portado) | DNA single-source |

## 2. Roster de agentes (fluxo enxuto — proposta)

Mantenho o princípio anti-fragmentação (voz única), mas você pediu **fluxo** (produção com vazão),
então proponho um estúdio pequeno com orquestração — não um agente solitário e não um time inflado:

1. **Diretor de Conteúdo · Maria Helena** — CEO da company. Orquestra, prioriza, fala com o board,
   guarda o brief de DNA como fonte de verdade, delega. `reportsTo: null`.
2. **Produtor de Conteúdo · Maria Helena** — pauta + roteiro + copy na voz da MH (estrategista+copywriter
   fundidos, para não fragmentar tom). `reportsTo: Diretor`.
3. **Diretor de Arte de Briefing · Maria Helena** — briefing visual por peça/rede (sem arte final,
   espelha o papel do EJUP). `reportsTo: Diretor`.
4. **Revisor de Qualidade & Marca · Maria Helena** — gate de voz/qualidade/DNA antes de entregar. `reportsTo: Diretor`.

> Enxugável para 3 (Diretor + Produtor + Revisor) se quiser começar mais leve — arte entra sob demanda.
> Cada agente sempre-ligado tem custo mensal; 4 é proporcional a um estúdio de 1 cliente.

## 3. Como o fluxo funciona (uma vez montado)

- Conteúdo **exclusivo das redes da MH** nasce e vive **nesta company** — EJUP não é emissora.
- Conteúdo **co-branded / institucional** continua no board EJUP (regra de roteamento por peça
  do doc de orientações, Bloco 1). Handoff entre as duas companies via card-espelho/comentário.
- O Diretor da company MH recebe a pauta, delega ao Produtor, passa pelo Revisor, entrega ao board.

## 4. O que preciso de você (2 gates de board)

- **Gate A — criar a company vazia** na UI do Paperclip (só você tem acesso). Nome + prefixo do item 1.
- **Gate B — preencher o intake de DNA da MH** (Bloco 2 do doc de orientações): curso/tema que ela
  ministra, bio, tom de voz, temas a puxar, o que aprovar/vetar. **Não invento área jurídica não confirmada** —
  sem isso os agentes-produtores não podem ser autorados com fidelidade (ficam em scaffold).

## 5. Minha entrega assim que A+B acontecerem

- Gero o **AGENTS.md completo de cada um dos 4 agentes** (Diretor + Produtor + Arte + Revisor),
  derivado das orientações + DNA, pronto para colar/semear.
- Se eu receber acesso à nova company, **crio os agentes via API** (`POST /api/companies/{id}/agents`)
  e ligo o reportsTo — a company já nasce operante.

## 6. Campo `mission` da company (board confirmou área = ambiental — EJUA-183, 2026-07-24)

O board confirmou (EJUA-183, 2026-07-24) a redação-âncora da missão e, no mesmo comentário, adicionou uma
**correção estratégica decisiva**: o objetivo **não é unicamente converter matrículas na EJUP**. É uma
**missão de eixo duplo** — a autoridade construída serve (a) a atuação profissional da própria Maria Helena
como **advogada e consultora jurídica** e (b) a conversão em formações/conteúdos educacionais da EJUP. Os
dois objetivos coexistem; nenhum é subordinado ao outro. Isso destrava parte do Gate B (área = ambiental;
falta o intake fino: bio, tom, temas a puxar, aprovar/vetar).

Por que essa distinção importa (trava de coerência que os agentes precisam herdar): se a missão fosse só
conversão-EJUP, cada peça viraria funil de curso e a autoridade profissional dela — o ativo que sustenta
tanto a prática jurídica quanto o desejo pela formação — se degradaria em publicidade. O eixo pessoal
(reputação como advogada/consultora ambiental) é o que dá lastro à conversão; tratá-lo como fim legítimo,
e não como meio, protege a credibilidade da qual a EJUP também se beneficia.

O campo `mission` é o norte que **todos os agentes da company leem**. Codifica: propósito de eixo duplo,
quem é o herói, a lógica comercial responsável e os guardrails de voz/hierarquia. Valor revisado:

> **Consolidar Maria Helena Cortez como autoridade de referência em Direito Ambiental — com profundidade
> técnica, repertório contemporâneo e voz própria — produzindo e orquestrando o conteúdo de marca pessoal
> dela com um objetivo de eixo duplo: (1) fortalecer sua atuação profissional como advogada e consultora
> jurídica em Direito Ambiental e (2) sustentar e converter matrículas nas formações e conteúdos
> educacionais da EJUP. Os dois eixos coexistem; a autoridade profissional é fim legítimo, não apenas meio
> de conversão.**
>
> **O herói é o jurista/gestor que atua ou quer atuar na área ambiental; Maria Helena é a guia que oferece
> estrutura, repertório e caminho. Cada peça constrói percepção de expertise, aprofunda confiança, credencia
> Maria Helena na prática jurídica e prepara o desejo pela formação — nunca promete fórmula mágica, atalho,
> aprovação garantida ou resultado mágico.**
>
> **A voz de Maria Helena é fonte única e inegociável (DNA em `maria-helena-board-pessoal-orientacoes.md`);
> a EJUP é a escola emissora das formações. Este estúdio opera a marca pessoal dela isolado do board
> institucional EJUP, roteando ao board EJUP tudo que for co-branded ou institucional.**

Versão curta (se o campo pedir 1 frase):
> Consolidar Maria Helena Cortez como autoridade em Direito Ambiental — fortalecendo sua atuação como
> advogada/consultora e, com essa mesma autoridade, sustentando matrículas nas formações da EJUP; jurista
> ambiental como herói, MH como guia, profundidade sem atalho.
