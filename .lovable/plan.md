## Ajustes na página do produto (mobile)

### 1. Reordenar seções no `ProductDetail.tsx`
Hoje a ordem é: preço → cronômetro → provas sociais → **descrição** → tamanho → quantidade.

Mudar para: preço → cronômetro → provas sociais → **tamanho** → **quantidade** → **descrição**.

Assim a descrição fica depois das opções de compra, como o usuário pediz. Vale tanto para mobile quanto desktop (mesmo componente).

### 2. Deixar o CTA de compra muito mais claro

**Problema:** o botão "Comprar Agora" no rodapé fixo mobile é discreto — cliente não percebeu que era ali que pedia.

**Mudanças na barra fixa inferior (mobile):**
- Aumentar o botão "Comprar Agora" ocupando **2/3 da largura** (o "Adicionar" fica menor à esquerda, 1/3).
- Texto maior e mais direto: **"PEDIR AGORA"** em caixa alta, com ícone de WhatsApp/raio ao lado.
- Cor mais vibrante: gradiente accent→primary com **pulse sutil** (animate-pulse leve) para chamar atenção.
- Adicionar um pequeno rótulo acima do botão: "👇 Toque para finalizar seu pedido" em fonte pequena, aparece só quando o usuário rola até o meio do produto (ou sempre visível — mais simples e efetivo).
- Sombra mais forte (`shadow-elevated`) para destacar do fundo.

**Quando o produto está em promoção (cronômetro ativo):**
- Substituir texto por **"🔥 GARANTIR OFERTA"** com fundo vermelho/laranja igual ao banner de promo (mesmo gradiente animado do `PromoCountdownBanner`), reforçando a urgência.
- Micro-cronômetro compacto (MM:SS) ao lado do texto, para lembrar que é por tempo limitado.

**Desktop:** aplicar a mesma clareza — trocar "Comprar Agora" por "PEDIR AGORA" e usar o gradiente promo quando `promo_active` estiver ligado.

### 3. Detalhes técnicos
- Mover o bloco `<p className="whitespace-pre-line">{product.description}</p>` para depois do bloco de quantidade em `ProductDetail.tsx`.
- Detectar promo ativa reutilizando `useCountdown(product.promoEndsAt)` no topo do componente e usar o flag `isPromo` para trocar estilo/texto dos dois CTAs (mobile fixo + desktop grid).
- Grid do rodapé mobile passa de `grid-cols-2` para `grid-cols-3` com o "Adicionar" ocupando `col-span-1` e o "Pedir Agora" ocupando `col-span-2`.
- Sem mudanças em banco, edge functions ou lógica de negócio — só reordenação e estilo do CTA.
