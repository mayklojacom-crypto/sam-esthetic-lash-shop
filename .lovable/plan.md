## Objetivo
Transformar a seção "Destaques" da home num mini-catálogo rico, com muitos produtos organizados e fáceis de navegar — sem quebrar o restante da página.

## O que muda na Home (`src/pages/Index.tsx`)

1. **Seção "🔥 Destaques" turbinada**
   - Mostrar **todos os produtos marcados como `featured`** (hoje o `.slice(0,2)` + `.slice(2)` limita visualmente o fluxo por causa dos kits no meio).
   - Layout em grid responsivo: 2 colunas mobile, 3 sm, 4 md, 5 lg.
   - Kits promocionais (Master Beauty + Protagonista) saem do meio do grid e viram uma **faixa própria** logo acima, com destaque visual — não competem mais com os cards de produto.

2. **Novas seções por categoria (mini-catálogo na home)**
   Abaixo dos destaques, adicionar carrosséis horizontais por categoria, cada um com título + "Ver todos →":
   - Cílios
   - Colas & Removedores
   - Pinças & Acessórios
   - Unhas / Nail
   - (as categorias existentes em `src/data/products.ts` — mostro só as que têm produtos)
   
   Cada linha usa scroll horizontal no mobile (padrão que já existe em Categorias) e grid no desktop, com **8 produtos por categoria** e botão "Ver todos" que leva para `/catalogo?cat=<id>`.

3. **CTA final** "Ver catálogo completo" grande, levando para `/catalogo`.

## O que NÃO muda
- Header, UrgencyBar, HeroBannerCarousel, TrustBar, Categorias, Info Cards, Footer, BottomNav — tudo permanece igual.
- Página `/catalogo`, ProductCard, hook `useProducts` — sem alterações.
- Nenhuma mudança no banco / produtos / lógica de negócio.

## Detalhes técnicos
- Usar `useProducts()` já existente e derivar listas em memória: `featured`, e `byCategory = groupBy(products, 'category')`.
- Reaproveitar `<ProductCard />` para consistência visual.
- Novo subcomponente inline `CategoryRow` (título + grid/scroll + link "Ver todos") dentro do próprio `Index.tsx` para manter simples; se crescer, extrair para `src/components/CategoryRow.tsx`.
- Usar `categories` de `src/data/products.ts` para os rótulos e ordem.

## Resultado esperado
Home vira uma vitrine navegável: destaques cheios, kits em destaque próprio, e uma "prateleira" por categoria — cliente encontra mais produto sem precisar entrar no catálogo.
