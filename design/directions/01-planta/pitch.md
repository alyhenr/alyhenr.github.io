# Planta

Seu site desenhado como uma planta de engenharia: papel claro com traço azul de dia, o azul clássico do blueprint à noite. Quem chega pelo WhatsApp vê na hora o que você faz e já monta o próprio orçamento logo no topo, marcando páginas e recursos. O total e o prazo viram como num painel de aeroporto, e o orçamento inteiro vai para o seu WhatsApp numa mensagem pronta.

Passa a ideia de um trabalho medido e combinado antes de começar: preço fechado, prazo em dias úteis, carimbo e revisão, como numa obra bem feita. É técnico na moldura e simples no texto, para o dono do salão ou da oficina ler sem esforço no celular.

## A ideia
O site como uma folha de desenho técnico sendo especificada: a calculadora é o próprio desenho e o orçamento é o carimbo da folha.

## Por que serve para este público
Dono de pequeno negócio quer duas respostas antes de tudo: quanto custa e quando fica pronto. Aqui as duas estão no primeiro scroll, com cara de documento sério (cota, carimbo, revisão), o que passa confiança sem jargão. A malha e as cotas ficam na moldura e nos desenhos; o texto corrido fica sempre sobre papel liso.

## Paleta
| Token | Claro (cópia heliográfica) | Escuro (blueprint) |
|---|---|---|
| background | #EEF3F7 | #0F3A6B |
| surface | #FFFFFF | #124479 |
| text | #0C2A4D | #F1F6FB |
| textMuted | #46607C | #B7CDE4 |
| primary | #1A4F99 | #F1F6FB |
| onPrimary | #FFFFFF | #0D3463 |
| border | #9DB2C8 | #5A82B0 |
| danger | #B3261E | #FFA196 |
| success | #1D6E43 | #93E2B5 |
| revision (extra) | #C2362A | #FFB3A6 |
| board / flap (extra) | #0B2341 / #16365E | #08203F / #123A68 |
| tint (extra) | #E3ECF6 | #1A538F |

Raios pequenos (2, 4 e 6 px), como régua e esquadro. Uma sombra só, no carimbo do orçamento e na barra fixa do celular.

## Fontes
- heading: Archivo 800, largura 75% (condensada, letra de prancha).
- body: Archivo 400, largura 100%.
- bodyStrong: Archivo 600.
- mono: Martian Mono 500, largura 87,5%, só para medidas: preços, prazos, datas, cotas e o placar.
Um único @import do Google Fonts (OFL), 2 famílias, 4 pesos; o Archivo vem num arquivo variável só.

## Componente-assinatura
O carimbo do orçamento: um quadro de carimbo de engenharia (Rev. 0, data) com o total e o prazo num placar split-flap que vira dígito a dígito quando você marca algo. Ao lado, as "pranchas": 8 folhinhas que se preenchem com o número de páginas, com uma linha de cota que cresce junto. Os valores provisórios ficam numa nuvem de revisão vermelha com o triângulo Δ1, como se marca uma alteração numa planta.

## Look e técnicas
- Look (visual-vocabulary): **Blueprint** (principal) e **Split-flap** (acento, só no total e no prazo do orçamento; instantâneo com prefers-reduced-motion).
- web-craft: **Live calculator hero**. A calculadora é o hero: promessa no topo, carimbo que recalcula a cada toque (fixo ao lado no desktop), faixa de garantias só com fatos e um letreiro lento dos recursos. No celular, enquanto as opções rolam, o orçamento vira uma barra compacta presa embaixo que abre ao tocar (só aparece depois que a pessoa toca ou rola a página, para não cobrir as fotos de divulgação).

## Studio
Só o loop "como-funciona" de 20 s, como storyboard: quadro 4:5 (1080 × 1350) logo depois do hero, com os 4 quadros-chave desenhados em SVG no traço da planta. Nenhuma outra peça do Studio.

## Notas para o Alysson
- Preços e prazos são provisórios, num objeto `PRICES` no topo do script; os pacotes e o "a partir de" se recalculam a partir dele.
- `WHATSAPP_NUMBER` está vazio: os links abrem o WhatsApp para escolher o contato.
- A política de privacidade do Pipa aponta para `/pipa/privacidade/`, que ainda não existe.
- As linhas de stack da página em inglês são um rascunho: confira se descrevem o que você usa.
