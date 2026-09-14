# Minerva — assistente conversacional

Página publicada como artifact no claude.ai. Responde com a conta Claude de
quem abre a página (capacidade `sample` do runtime de artifacts): não há
chave de API, servidor nem custo fixo.

## O que ela sabe
Tudo em `docs/minerva/base-de-conhecimento.md`: charter da marca, quem é
quem, pilares, arquitetura editorial, checklist, identidade visual, peças já
produzidas, squad e pendências. **Para ensinar algo novo, edite esse arquivo
e rode `_build/build.py`, depois republique.** Limite prático: 30 KB.

O que ela ainda não sabe, e diz que não sabe: lista de clientes, alunos e
parceiros comerciais. Não está no repositório.

## Como funciona
- `_build/template.html`: a página (tema claro e escuro, Gotham embutida).
- `_build/build.py`: injeta fontes, símbolo e a base; gera `minerva.html`.
- A conversa fica no navegador de quem usa (localStorage). Cada pergunta
  envia as instruções + o histórico recente; o histórico é cortado por
  tamanho, as instruções nunca.
- Voz: o microfone usa o reconhecimento de fala do navegador (Chrome) e o
  botão "Voz" lê as respostas com a síntese de voz do sistema, em pt-BR se
  houver voz instalada.
- Ela não posta, não agenda, não acessa arquivos: é conversa e critério.
