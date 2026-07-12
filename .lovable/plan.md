## Cronômetro de promoção + Seção Super Oferta + Descrição formatada

### 1. Banco de dados
Adicionar 2 colunas em `products`:
- `promo_active` (boolean, default false) — liga/desliga cronômetro
- `promo_ends_at` (timestamptz, nullable) — data/hora do fim da promo

### 2. Admin — página de produto (`AdminProducts.tsx`)
No formulário de criar/editar produto, adicionar:
- **Toggle "Ativar cronômetro de promoção"** (igual ao toggle "Destaque")
- Quando ativo, aparece um **campo de data/hora** (`<input type="datetime-local">`) para definir quando a promo termina
- Ao salvar, envia `promo_active` e `promo_ends_at`

Também trocar o `<textarea>` de descrição para **preservar quebras de linha e emojis**:
- Manter textarea simples no admin
- Nas telas do cliente, renderizar com `whitespace-pre-line` para respeitar `\n` e emojis colados

### 3. Nova seção "🔥 Super Oferta" (só na home)
Criar `src/components/SuperOfferSection.tsx`:
- Busca produtos onde `promo_active = true` E `promo_ends_at > now()`
- Aparece **logo abaixo do carrossel de banners**, antes das categorias
- Design vibrante para dar vida:
  - Fundo com gradiente animado (primary → accent → orange) e textura sutil
  - Título grande "⚡ SUPER OFERTAS RELÂMPAGO" com pulse
  - Subtítulo "Promoções por tempo limitado — corra!"
  - Cards horizontais scrolláveis (mobile) / grid (desktop) com:
    - Badge "-XX% OFF" grande e chamativo
    - **Mini cronômetro no próprio card** (HH:MM:SS) contando até `promo_ends_at`
    - Selo pulsante "🔥 ACABA EM"
    - Preço riscado + preço promocional destacado
    - Botão "COMPRAR AGORA" com brilho animado
- Se nenhum produto ativo, seção não renderiza
- Auto-remove produtos cuja promo expirou (filtro por `promo_ends_at > now()` no client, revalida a cada 30s)

### 4. Página do produto (`ProductDetail.tsx`)
Quando `promo_active` e `promo_ends_at` no futuro:
- Banner de urgência acima do preço: "⚡ Oferta termina em HH:MM:SS" com cronômetro ao vivo
- Estilo destacado (gradiente + pulse)

Descrição do produto: usar `whitespace-pre-line` para respeitar formatação digitada.

### 5. Detalhes técnicos
- `useProducts` hook: incluir `promo_active` e `promo_ends_at` no select e no mapping
- `useProducts.ts` types + `Product` type em `products.ts`: adicionar os campos opcionais
- `admin-products` edge function: já aceita qualquer campo via spread, sem mudança
- Cronômetro: hook `useCountdown(targetDate)` retornando `{h,m,s,expired}`, atualiza a cada 1s
- Home (`Index.tsx`): inserir `<SuperOfferSection />` entre o carrossel de banners e a próxima seção

### Fluxo de uso
1. Admin edita produto → liga toggle "Cronômetro de promoção" → escolhe "15/07/2026 23:59" → salva
2. Produto aparece automaticamente na seção Super Oferta da home com contador ao vivo
3. Quando o tempo zerar, some da seção sem precisar desativar manualmente
