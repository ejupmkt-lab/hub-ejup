# Modelo — carrossel do perfil pessoal de Roberto Pivotto

Cinco telas de **1080×1350**, com **dois quadros empilhados** em cada uma,
no formato da referência guardada em `docs/referencias/vontade-de-aprender-tudo/`.
Dez quadros ao todo, um por tempo do roteiro em `docs/roteiros/perfil-roberto-repertorio.md`.

**Peça de perfil pessoal.** O charter da marca EJUP não governa paleta nem
assinatura aqui. O amarelo da legenda e o preto do quadro vêm da referência,
e não da paleta institucional. Continuam valendo as regras transversais de
linguagem: sem travessão entre palavras e sem a figura "não é X, é Y".

## Como usar

1. Abra `modelo-perfil-roberto.html` no navegador. Funciona offline, sem
   servidor.
2. **Arraste uma foto** para dentro de cada quadro, ou clique para escolher.
3. Depois de solta, **arraste dentro da foto** para reenquadrar e use o
   controle de zoom ao lado.
4. **Clique no texto** para editar. É assim que as lacunas entre colchetes
   viram as frases que o Roberto disser na entrevista.
5. Exporte em **PNG**, tela a tela ou as cinco de uma vez.

Cada quadro vazio mostra a sugestão de imagem daquele tempo, que some assim
que a foto entra.

## O texto que está no modelo

| Tela | Quadro de cima | Quadro de baixo |
|---|---|---|
| 1 | Eu nunca consegui estudar uma coisa só. | [assunto 1], [assunto 2], [assunto 3]. E Direito. |
| 2 | Me ensinaram cedo que profissional sério escolhe uma coisa | e fecha o resto. |
| 3 | Quem fecha o resto fica com uma ferramenta só. | E problema de cliente não chega dividido por matéria. |
| 4 | [o que veio de fora: o livro, a viagem, o outro ofício] | [e o problema jurídico que aquilo resolveu] |
| 5 | Curiosidade sem profundidade é passatempo. | Quero aprender de tudo. E continuar sendo o melhor em [a sua coisa]. |

As quatro lacunas saem das perguntas 3, 4, 7 e 8 do roteiro de entrevista.
A tela 4 é a que sustenta a peça: sem o caso concreto dele, o carrossel vira
elogio genérico à curiosidade.

## Produção

- `_build/gerar.py` embute as fontes Gotham em base64 e escreve o HTML.
- `_build/render.py` exporta as telas em PNG e confere altura de legenda.
- O PNG sai por SVG e `foreignObject`, servido como `data:` URL para o canvas
  não ficar marcado. Mesmo caminho do carrossel do Startup Summit.
