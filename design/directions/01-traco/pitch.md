# Traço

Seu site começa como um palco escuro, e enquanto a pessoa rola a página, linhas soltas se juntam e desenham um site num celular, passo a passo: conversa, proposta, sinal, entrega. Quando ela chega ao fim, leu como funciona e viu acontecer. "O site é seu. Tudo dele é seu." fecha a cena em letras grandes.

Depois do palco, a página fica clara e direta: pacotes prontos com preço de lançamento, uma calculadora que mostra o valor na hora e leva a estimativa para o formulário, quem faz, e o contato. É a direção mais cinematográfica das três: impressiona no primeiro segundo e passa a ideia de algo construído com precisão.

## A ideia
A página inteira é um desenho técnico sendo montado: a rolagem é a construção, e o site pronto no celular é o fim do filme.

## Por que serve a um engenheiro sênior vendendo sites
O dono de um pequeno negócio não lê arquitetura, mas reconhece capricho. Ver as linhas virarem um site, no ritmo exato dos quatro passos, mostra método sem jargão: primeiro se conversa, depois se mede, depois se constrói. A cena é a prova de ofício; o resto da página é sóbrio, para não competir com ela.

## Look e técnicas
- Look (visual-vocabulary): **Wireframe 3D**, sem acento. Linhas de giz sobre grafite, um âmbar só para o que importa (o fio da conversa, as cotas, o sinal pago, o botão).
- web-craft: **Cinematic landing page** (hero escuro em tela cheia, tipografia enorme, seções que passam sobre um palco preso). Feito com `position: sticky` e um pouco de JavaScript em vez de GSAP e Lenis: a mesma sensação, ~70 KB a menos no celular. Mais o **Live calculator hero** na calculadora (o cartão escuro que recalcula a cada toque).

## Peças
- **Studio · traco-wireframe** (feita pelo Studio, em Three.js): a cena do palco, presa à rolagem. Direção em `design/scenes/traco-wireframe.md`, quadros-chave em `design/scenes/traco-wireframe/frames/`. No mockup, o palco mostra os quadros-chave trocando a cada passo (é também o comportamento com movimento reduzido), com a etiqueta "Studio · traco-wireframe" e a ficha da peça logo depois do palco.
- Feito de verdade na página: o palco preso, a troca de quadros, a barra de progresso dos passos, a calculadora, o formulário, e na página Projetos o diagrama vivo do Jarvis (SVG, pacotes de dados percorrendo os fios).

## Paleta
| Token | Claro | Escuro |
|---|---|---|
| background | #E8ECEB | #0E1517 |
| surface | #F7F9F8 | #152022 |
| text | #0F1719 | #E6ECEA |
| textMuted | #4C5A5C | #9AA8A9 |
| primary | #A35A00 | #F2A93B |
| onPrimary | #FFFFFF | #1A1204 |
| border | #C3CCCD | #2A3A3D |
| danger / success | #B3261E / #1D6E43 | #FF8A80 / #7BD9A6 |
| palco (fixo) | #0E1517, giz #D9E2E0, âmbar #F2A93B | igual |

O palco é escuro nos dois modos, como uma sala de cinema; o resto segue o modo do celular.

## Fontes
- heading: Anybody 800–900, largura 125–150% (larga, de letreiro).
- body: Hanken Grotesk 400.
- bodyStrong: Hanken Grotesk 600.
- mono: nenhuma (os números usam algarismos tabulares da Hanken Grotesk).
Um @import do Google Fonts (OFL), 2 famílias.

## Componente-assinatura
O palco preso com a cena do Studio: o site que se desenha enquanto os quatro passos passam, terminando em "O site é seu. Tudo dele é seu."

## Leve no celular
Sem bibliotecas no mockup (site.js + 1 script inline, ~12 KB). Na versão real, a cena carrega depois da primeira pintura e cai para os quadros-chave em celular fraco, com economia de dados ou sem WebGL.

## Notas para o Alysson
- Preços e prazos são provisórios, no objeto `CATALOGUE` no topo de `site.js` (igual nas três direções); pedi à agência o catálogo real (`prices.json`) para trocar.
- O formulário valida e para: não envia nada (o envio é o item "Connect the contact form"). Nenhum telefone ou e-mail aparece na página.
- Confira as frases sobre você ("engenheiro de software sênior", "sistemas que não podem parar") e o prazo de resposta "até 1 dia útil".
