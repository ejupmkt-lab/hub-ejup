# Capas dos destaques do Instagram · EJUP

Sete destaques, 1080x1920 cada: curadoria, contato, quem somos, podcast,
bastidores, a sala, artigos. Pedido do Victor (07/10/2026): sair do fundo preto
com ícone branco para algo mais chamativo, dentro da IDV.

    python3 _build/gerar.py && python3 _build/mockup.py

## Duas direções
- **`navy/`**: fundo navy com facetas (o mesmo grafismo do sistema do
  EJUPcast), aro dourado com os dois pontos do selo ejup/cast e ícone em traço
  dourado com brilho suave. Dourado sobre navy, 9,5:1.
- **`ouro/`**: fundo dourado em degradê (ouro para bronze) com aro e ícone em
  navy. É a mais chamativa na fileira de destaques; navy sobre dourado mantém
  contraste máximo.

"Quem somos" usa o símbolo da EJUP no lugar de um ícone. Os demais são ícones
de traço desenhados no mesmo peso: livros com marcador (curadoria), balão de
conversa (contato), microfone de estúdio (podcast), claquete (bastidores), mesa
com duas cadeiras sob a luz, a cena de abertura do quadro (a sala), caneta
(artigos).

## Uso
O Instagram mostra só o círculo do centro: tudo o que importa está num
diâmetro de 840 px no meio da tela. Ao subir a capa, basta não mexer no
enquadramento. `mockup-*-claro.png` e `mockup-*-escuro.png` simulam a fileira
de destaques no perfil, nos modos claro e escuro do app.
