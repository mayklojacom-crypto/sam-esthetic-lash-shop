
## Ideia central
Transformar a home mobile numa experiência que parece o "quartinho da lash girl" — fofa, íntima, cheia de detalhes que dão vontade de printar — sem tirar o foco de comprar. Cada elemento decorativo é leve, não bloqueia CTA, e some no desktop (mantém o profissional lá).

## Direção visual "Lash Girly Universe"
- **Paleta afetiva**: mantém o rosa/roxo da marca, acrescenta acentos pêssego, lilás baby, dourado suave e um creme quentinho de fundo.
- **Micro-mascotes/stickers PNG decorativos** espalhados em cantos: 
  - Stitch fofo espiando o topo do carrinho
  - Cílios com carinha ✨
  - Coraçõezinhos, laços, estrelinhas, xícara de café, esmalte derramado
  - Aparecem levemente rotacionados, como stickers colados por cima — nunca em cima de botão ou preço
- **Tipografia com alma**: adicionar uma fonte display manuscrita (ex.: *Caveat* ou *Dancing Script*) só para títulos de seção ("Nosso mimo pra você", "Escolhidos com amor") — corpo continua Poppins.
- **Bordas mais orgânicas**: cards com raio maior, algumas bordas "recortadas" (SVG mask tipo etiqueta/ticket), sombras rosinhas suaves em vez de cinza.
- **Fundo com textura sutil**: papel/glitter bem discreto ou estrelinhas fixas, sem poluir.

## Camadas de personalidade (sem quebrar conversão)

### 1. Boas-vindas afetiva
Logo abaixo da UrgencyBar, uma faixa curta rotativa com mensagens "de amiga":
- "oi, lash lover 💗 bora deixar tudo perfeito hoje?"
- "chegou material novinho pra você ✨"
- "responde rapidinho no zap, promete 🤞"

### 2. Renomear seções com voz de menina
- "Categorias" → "O que você tá procurando, amor?"
- "🔥 Destaques" → "Os queridinhos da casa 💕"
- "Cílios" → "Cílios que a gente ama 👁️✨"
- "Promoções de Outono" → "Mimos da estação 🍂"
- CTA final: "Vem ver o catálogo inteirinho →"

### 3. Stickers decorativos posicionados
Camada `absolute` `pointer-events-none` `hidden md:hidden` (só mobile):
- Stitch espiando no canto do banner
- Coração + estrela ao lado do título "Queridinhos"
- Laço rosa no canto do card de kit promocional
- Xícara de café + "☕ tomando um cafézinho enquanto escolhe?" acima da seção de categoria
- Rodapé com "feito com 💗 em Goiânia" manuscrito

### 4. Microinterações fofas
- Coração pulsando ao favoritar (já usa `hover-scale`)
- Toast do carrinho: "adicionado com carinho 💕" em vez de texto seco
- Botão "Comprar Kit" com brilho sutil deslizando
- Loading dos produtos: skeleton com cor rosinha + emoji girando

### 5. Bloco "Comunidade Lash"
Nova seção curta acima do footer (só mobile):
- Título manuscrito: "faz parte da nossa turma"
- Grid 3x1 de mini-cards: Instagram (@sam_estheticoficial), WhatsApp VIP, Dicas rápidas
- Fundo lilás claro com stickers ao redor

### 6. Frete/entrega com voz humana
- Ticker "entregamos em 45min" → "chega voando em 45min 🛵💨 Goiânia + Aparecida"
- Trust bar: "Compra Segura" → "Segurinha 🔒", "Entrega Brasil" → "Vai pra todo Brasil 📦", "Pix & Cartão" → "Pix, cartão, do seu jeito 💳"

## O que NÃO muda
- Estrutura de rotas, checkout, carrinho, admin, banco.
- ProductCard, useProducts, catálogo — só ganham skin.
- Desktop mantém o layout atual mais limpo (stickers escondidos via `md:hidden`).
- Nenhuma nova dependência pesada — só imagens PNG geradas e uma fonte Google.

## Entregáveis (quando aprovado)
1. `src/assets/stickers/` — gerar 6-8 stickers PNG transparentes (stitch, coração, laço, estrela, xícara, cílio-fofo, esmalte, fita).
2. `src/index.css` — importar fonte manuscrita + tokens de cor pêssego/lilás/dourado + sombra rosinha + textura de fundo.
3. `tailwind.config.ts` — família `font-hand` para display.
4. `src/pages/Index.tsx` — renomear seções, injetar camada de stickers absolutos (mobile only), adicionar bloco "Comunidade Lash".
5. `src/components/UrgencyBar.tsx` (ou novo `WelcomeStrip.tsx`) — faixa rotativa de mensagens de amiga.
6. `src/components/DeliveryTickerBar.tsx` — reescrever textos com voz humana.
7. Toast do `CartContext` — copy afetivo.

## Perguntas rápidas antes de mandar bala
1. Pode usar personagens reconhecíveis tipo **Stitch** de verdade (imagem oficial Disney = risco de direitos autorais) ou prefere que eu crie um **"lashzinho mascote" original** no mesmo estilo fofo?
2. Quer que eu **mantenha o desktop mais sério** (stickers só no mobile) ou leve a personalidade pros dois?
3. A **voz "de amiga"** pode ser bem informal ("amor", "linda", "bora") ou prefere um tom fofo porém neutro (sem apelidos)?
