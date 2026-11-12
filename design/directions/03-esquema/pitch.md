# Esquema

Seu site se explica como um engenheiro explicaria: texto bem escrito, sem pressa, e desenhos vivos de como as coisas funcionam. Logo no topo, o desenho do próprio site mostra o cliente chegando pelo seu domínio, as páginas abrindo e o pedido de orçamento chegando até você. Na calculadora, cada coisa que a pessoa marca entra no desenho e na conta, na hora.

Não tem vídeo nem efeito: tudo o que se mexe responde a quem está lendo. Passa a imagem de alguém que sabe exatamente o que está construindo, e que escreve o preço antes do código. É a direção mais sóbria das três, e a mais leve no celular.

## A ideia
O site como um sistema pequeno, explicado por quem constrói sistemas grandes: diagramas vivos, tabelas precisas e notas na margem.

## Por que serve a um engenheiro sênior vendendo sites
É a voz do próprio Alysson: clara, técnica na medida, honesta sobre como a conta é feita e sobre o que fica com o cliente. Para quem tem um pequeno negócio, "ver o desenho" do site tira o medo do desconhecido; para quem é técnico (e para quem chega pela página Projetos), mostra o mesmo rigor que ele usa no trabalho.

## Look e técnicas
- Look: nenhum nome da visual-vocabulary descreve bem. Proposta de nome novo: **Esquema** (diagramas de caixas e fios em traço fino sobre papel claro, com pequenos pacotes que percorrem os fios, tipografia editorial e notas de margem em mono). O mais perto na lista é Blueprint, mas sem o fundo azul e sem as cotas. Mandei a proposta para o Jarvis.
- web-craft: **Live data-pipeline dashboard**, aplicado ao processo: a faixa de etapas no topo com a ativa acesa (conversa, proposta, sinal, entrega), o painel de detalhes, e os fios em SVG por onde os pacotes andam; tudo sobre dados simulados, avisados como simulação. Mais o **Live calculator hero** na calculadora, que aqui desenha o site enquanto calcula.

## Peças
- Nenhuma peça do Studio: é tudo trabalho de página, feito de verdade no mockup.
- Feitos de verdade: a "Anatomia do seu site" (SVG vivo com rotas: visita, busca, pedido, mudança), a faixa das quatro etapas (avança sozinha até a pessoa tocar), a tabela "O site é seu. Tudo dele é seu.", a tabela dos pacotes, o desenho que cresce com a calculadora, o formulário, e na página Projetos o diagrama vivo do Jarvis com o registro do que está passando.

## Paleta
| Token | Claro | Escuro |
|---|---|---|
| background | #F3F4F1 | #0F1513 |
| surface | #FFFFFF | #161E1B |
| text | #15201B | #E3EAE6 |
| textMuted | #55615B | #9AA8A1 |
| primary | #0F7A57 | #4FD1A0 |
| onPrimary | #FFFFFF | #08241A |
| border | #D3D8D3 | #27332E |
| danger / success | #B42318 / #0F7A57 | #FF9C8F / #4FD1A0 |
| wire / signalSoft (extras) | #A3ADA7 / #DCEFE6 | #4A5952 / #173A2D |

## Fontes
- heading: Newsreader 400–500 (serifa editorial, itálico só para uma palavra do título).
- body: Newsreader 400.
- bodyStrong: Newsreader 600.
- mono: IBM Plex Mono 400–500, só para diagramas, números, rótulos de dados e as notas de margem.
Um @import do Google Fonts (OFL), 2 famílias.

## Componente-assinatura
O desenho que cresce na calculadora: páginas e recursos se ligam ao "seu site" enquanto a estimativa muda ao lado.

## Leve no celular
Sem vídeo, sem WebGL, sem bibliotecas: SVG e ~15 KB de script. Os diagramas param fora da tela e com a aba escondida; com movimento reduzido, nada anda e o registro mostra as rotas como lista.

## Notas para o Alysson
- Preços e prazos são provisórios, no objeto `CATALOGUE` no topo de `site.js`; pedi à agência o catálogo real.
- "Um link de prévia para acompanhar" (etapa 3) é uma promessa: confira se é assim que você quer trabalhar.
- O formulário valida e para: não envia nada. Nenhum telefone ou e-mail aparece na página.
