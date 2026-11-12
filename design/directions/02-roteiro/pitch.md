# Roteiro

Seu site abre com um filme de 24 segundos, sem som, em letras grandes que se mexem: "Me conta do seu negócio", "Preço fechado", "Metade agora, metade na entrega", "O site é seu". Quem chega pelo Instagram ou pelo WhatsApp entende tudo antes de ler uma linha, e o mesmo filme vira post e status.

Embaixo, a página é o roteiro do filme: cada parte é um capítulo com o seu minuto, a frase do filme como legenda, e o que a pessoa precisa saber ali: os pacotes e a calculadora na proposta, a conta dos 50% no sinal, o que é dela na entrega. É a direção mais calorosa e direta das três, azul e amarelo, fácil de ler no sol.

## A ideia
O site é um filme curto, e a página é o roteiro escrito: o capítulo em que você está fica marcado numa barra de tempo presa no topo.

## Por que serve a um engenheiro sênior vendendo sites
Quem compra um site pequeno decide em segundos e quase sempre pelo celular. Um filme de 24 s explica o processo inteiro sem jargão, e a página logo abaixo entrega os detalhes com a precisão de um roteiro: tempos, valores, o que acontece em cada etapa. A seriedade está na ordem e nos números; o filme faz o convite.

## Look e técnicas
- Look (visual-vocabulary): **Kinetic type**, sem acento. Palavras grandes em caixa alta que entram no ritmo da mensagem, no filme e nos títulos dos capítulos.
- web-craft: **Cinematic landing page** (o filme em destaque no topo, título enorme, um único botão) com a barra de capítulos presa no topo no lugar das seções fixas; **Live calculator hero** na calculadora (o cartão escuro com o total em amarelo).

## Peças
- **Studio · roteiro-filme** (feita pelo Studio com o kit de vídeo em Remotion): o filme de 24 s, em 16:9 e 4:5. Direção em `design/scenes/roteiro-filme.md`, quadros-chave em `design/scenes/roteiro-filme/frames/`. No mockup, o espaço do filme tem o tamanho real, a etiqueta "Studio · roteiro-filme" e um botão que passa pelos quadros-chave com o contador de tempo; a ficha da peça fica antes do contato.
- Feito de verdade na página: a barra de capítulos com a agulha de tempo seguindo a rolagem, a calculadora, a divisão 50/50 que acompanha a estimativa, o formulário, e na página Projetos o diagrama vivo do Jarvis.

## Paleta
| Token | Claro | Escuro |
|---|---|---|
| background | #F4F5F7 | #0A0F24 |
| surface | #FFFFFF | #121939 |
| text | #0D1633 | #EEF0F8 |
| textMuted | #4A5270 | #A3AACB |
| primary | #1E3BD0 | #93A5FF |
| onPrimary | #FFFFFF | #0A1240 |
| border | #D6D9E3 | #283163 |
| danger / success | #B42318 / #12704A | #FF9C8F / #7EDDB0 |
| film / filmInk / subtitle (extras) | #1E3BD0 / #0A1240 / #FFD23F | iguais |

## Fontes
- heading: Big Shoulders Display 900, caixa alta (condensada, de cartaz e letreiro de cinema).
- body: Figtree 400.
- bodyStrong: Figtree 700.
- mono: nenhuma (timecodes na Big Shoulders).
Um @import do Google Fonts (OFL), 2 famílias.

## Componente-assinatura
A legenda: a frase do filme em amarelo sobre azul-escuro, abrindo cada capítulo com o seu minuto (00:06, "Preço fechado antes de começar.").

## Leve no celular
O filme só carrega quando chega perto da tela (até 1,6 MB por corte, H.264), com a capa antes; com economia de dados, só a capa. Na página, nenhuma biblioteca.

## Notas para o Alysson
- Preços e prazos são provisórios, no objeto `CATALOGUE` no topo de `site.js`; pedi à agência o catálogo real.
- O filme não diz valores, de propósito: o preço muda, o filme fica.
- O formulário valida e para: não envia nada. Nenhum telefone ou e-mail aparece na página.
- Os "Créditos" listam só você: confira se o tom está bom.
