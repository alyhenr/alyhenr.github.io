# Feira

Seu site com cara de rua brasileira: a placa amarela de preço da feira, o letreiro pintado à mão da loja da esquina, cor chapada e contorno grosso. Quem chega pelo WhatsApp vê em dois segundos o que você faz e quanto custa ("a partir de R$ 900 o site", escrito como se fosse o preço do quilo), e entende que está falando com alguém direto, sem enrolação.

O dono do salão ou da oficina reconhece esse mundo na hora, porque é o mundo dele. E tudo responde ao toque: as opções da calculadora afundam quando você marca, o total sobe contando até o valor novo, os pacotes levantam da mesa. É o seu jeito de mostrar, no próprio site, que você faz coisa bem acabada e que dá vontade de usar.

## A ideia
Comércio de rua, levado a sério: cada preço é uma placa, cada botão é um bloco que você aperta de verdade.

## Por que serve a este público
Dono de pequeno negócio vem do WhatsApp ou do Instagram, no celular, com pressa. Preço visível no primeiro olhar, uma ação só (chamar no WhatsApp), linguagem de balcão. O visual vem da feira e do letreiro pintado, que ele conhece e em que confia, não do mundo das startups. Os blocos chapados e o contorno grosso leem bem em tela barata, com sol, e pesam pouco.

## Paleta
Claro: fundo azul-piscina `#BFE4F1` (parede pintada), superfície `#FFFFFF`, tinta roxo-noite `#1B1530` (texto, contornos, sombras duras), texto secundário `#463F5E`, primária rosa-choque de oferta `#D9145A` (texto branco), amarelo-cartaz da placa `#FFDD3C`, azul-anil `#2950D8`, laranja da fita `#FF7B22`, e as cores dos passos/quadros: rosa `#FF8FB4`, menta `#8FD3B0`, damasco `#FFB27A`. Sucesso `#11804A`, perigo `#C81E3A`.
Escuro: os mesmos blocos sobre chão noturno `#151027`, superfície `#231B40`, texto `#FFF4DC`; contorno e sombra viram creme `#F2E8D0` (como adesivo), rosa `#FF4A86` e anil `#7D97FF` mais claros, com texto escuro em cima. A placa amarela fica igual.
Raio 6/12/18 px; contorno 3 px; sombra dura 5 px sem desfoque; espaçamento 4, 8, 12, 16, 24, 32, 48, 72.

## Tipos
- heading: Shrikhand 400 (Google Fonts, OFL): letra de pintor de letreiro, usada em títulos, preços e na placa.
- body: Archivo 400 (OFL).
- bodyStrong: Archivo 600 e 800 (rótulos, botões, linhas da comanda).
- mono: nenhum; números em Archivo com algarismos tabulares.
Total: 2 famílias, 4 pesos, `display=swap`.

## Componente assinatura
A placa de preço: papelão amarelo torto, contorno grosso, "a partir de / R$ 900 / o site" a pincel, risco rosa por baixo e o palito de madeira espetado, como na banca da feira. Entra com um tapa só ao carregar a página. A mesma linguagem volta no total da calculadora e nos pacotes.

## Look e técnicas
- Look (visual-vocabulary): **Neo-brutalism**, sem look de acento. Aqui ele serve para parecer comércio de rua: blocos chapados, contorno grosso, sombra dura deslocada, movimento curto e decidido.
- web-craft: **Animated component kits**, a ideia levada para CSS e JS puros (o site não tem React): opções da calculadora que afundam na própria sombra ao marcar, contador de páginas com o número que pula, os 4 passos como acordeão animado, pacotes que levantam no hover, total que conta até o valor novo, botões que afundam ao apertar. Todo movimento responde a um gesto; com movimento reduzido, tudo é instantâneo.
- Sem cinematic landing nem live calculator hero: a calculadora é uma seção inteira ("Quanto custa seu site?"), e o topo é a placa de preço + WhatsApp.

## Studio
Só o vídeo "como-funciona" de 20 s (4:5, 1080×1350, na largura do conteúdo logo abaixo do topo), mostrado aqui como storyboard de 4 quadros desenhados no visual da Feira (0–5 s conversa, 5–10 s proposta, 10–15 s Pix, 15–20 s site no ar), sem avanço automático. Nenhuma outra peça do Studio.

## Para o Alysson decidir
- Preços e prazos são provisórios, num objeto `PRICES` no topo do script; o número do WhatsApp vai em `WHATSAPP_NUMBER`.
- O link "Política de privacidade" do Pipa aponta para `/pipa/privacidade/`, um endereço proposto que ainda não existe.
- A frase de stack na seção em inglês (TypeScript, React, React Native) é suposição; confirme.
