# Cena

Seu site como uma estreia: as palavras entram em cena. Quem chega pelo WhatsApp vê primeiro "Sites rápidos para o seu negócio" em letras enormes, que se esticam até ocupar a tela uma única vez e param. Depois, os quatro passos (Conversa, Proposta, Sinal de 50%, Entrega) sobem ao palco um de cada vez enquanto a pessoa rola. Não tem foto de banco, nem enfeite: só tipografia, um vinho profundo e uma luz âmbar, e isso já mostra que você sabe fazer uma página que prende a atenção.

É um visual calmo e confiante, mais de teatro do que de agência. Passa a ideia de quem leva o próprio trabalho a sério, sem cara de tecnologia fria. E é leve: tudo é texto e um pouco de CSS, então abre rápido num Android simples no 4G, que é exatamente o que você promete para os seus clientes.

## A ideia
O palco e a plateia: as seções de "show" (abertura, passos, trabalhos, contato) ficam sempre no palco vinho com a luz âmbar; as seções de decidir (calculadora, pacotes, produtos) ficam na "plateia", clara de dia e escura à noite.

## Por que serve para esse público
O dono de salão ou de oficina chega no celular, com pressa e desconfiado de preço. Aqui ele lê em três segundos o que você faz, o preço "a partir de R$ 900" e o botão do WhatsApp, sem nada competindo. Os passos em palavras gigantes respondem a dúvida que mais trava a venda ("como funciona e quando eu pago?") de um jeito que fica na cabeça.

## Paleta
Palco (igual nos dois modos): `--stage` #4A1020 (vinho), `--stageDeep` #2F0913, `--onStage` #FBEDE4, `--onStageMuted` #DDB6B8, `--light` #FFC56E (a luz âmbar, só no palco), `--onLight` #3A0B16.

Claro: `--background` #F4EDEE (papel rosado, não creme), `--surface` #FFFFFF, `--text` #24090F, `--textMuted` #694850, `--primary` #7E1730, `--onPrimary` #FFF3E6, `--border` #E2CFD3, `--danger` #B42318, `--success` #2F6B3E.

Escuro: a plateia apaga e o palco fica sendo a área acesa. `--background` #1A0A0F, `--surface` #2A1219, `--text` #F7E8E3, `--textMuted` #C9A5AC, `--primary` #FFC56E (a luz vira a cor de ação), `--onPrimary` #3A0B16, `--border` #47232C, `--danger` #FF8A80, `--success` #8FD19E.

Por que não os padrões: nada de quase-preto com verde-ácido, nada de creme com terracota e serifa. O vinho saturado é cortina de teatro; o âmbar é luz de palco. Um só calor, uma só luz.

## Fontes
- heading: Anybody 800, eixo de largura 50–150% (um arquivo variável). É a fonte que faz o show: cada linha usa uma largura diferente.
- body: Instrument Sans 400.
- bodyStrong: Instrument Sans 600.
- mono: nenhuma (os números usam algarismos tabulares da própria Instrument Sans e da Anybody).
Total: 2 famílias, 3 pesos, um `@import` do Google Fonts com `display=swap`. Página (HTML + CSS + JS) em ~60 KB antes das fontes.

## Componente assinatura
As linhas "encaixadas": cada linha de título tem o mesmo tamanho e uma largura própria (font-stretch), calculada para preencher a largura do bloco exatamente, em qualquer tela (tamanho em unidades de container, `cqi`). "Sites" bem larga, "para o seu" condensada, como um cartaz de teatro. No carregamento, as quatro linhas saem condensadas e se esticam até o encaixe, em sequência, uma vez. Nos passos, cada palavra entra condensada e se abre quando chega.

## Look e técnicas
- Look (visual-vocabulary): **Kinetic type**, principal. Sem look de destaque.
- Técnica (web-craft): **Cinematic landing page**, em versão leve: abertura em tela cheia com tipografia enorme, e seções que fixam e revelam com `position: sticky` (os passos se empilham, um cobrindo o outro) e um IntersectionObserver que só troca classes. Sem biblioteca de rolagem, sem sequestrar a rolagem, sem vídeo ou imagem de fundo.
- Tudo aparece sem JavaScript e numa captura de página inteira: o empilhamento e as palavras condensadas só ligam quando o visitante começa a mexer (toque, roda do mouse ou teclado). Com `prefers-reduced-motion`, nada se move e o roteiro mostra o quadro 1, sem avançar sozinho.
- Calculadora: seção própria, calma, com o cartão de orçamento e uma linha do tempo (sinal hoje, restante na entrega com a data estimada).

## Studio
Uma peça só: o loop "como funciona" de 20 s, no quadro 4:5 da abertura (350 × 438 px no celular, até 440 × 550 no desktop). No mock é o roteiro: 4 quadros desenhados em HTML no visual desta direção, um por vez dentro do quadro, com as abas de tempo (0–5 s, 5–10 s, 10–15 s, 15–20 s) para tocar e ver cada um, e a etiqueta "Studio · como-funciona · 20 s". Nenhuma outra peça do Studio.

## Para o Alysson decidir
- Preços: provisórios, num objeto `PRICES` no topo do script; os pacotes são somados a partir dele.
- WhatsApp: a constante `WHATSAPP_NUMBER` no topo do script, vazia por enquanto.
- O link "Política de privacidade" do Pipa aponta para `/pipa/privacidade/`, que ainda não existe.
- A linha de stack em inglês (TypeScript, React Native, WebExtensions, Playwright) precisa ser conferida.
