## Trocar os banners do hero pelos 3 novos

Substituir os 3 banners atuais do `HeroBannerCarousel` pelos que você acabou de enviar e ajustar os links de cada um pra levar pro lugar certo.

### Novos banners e destinos
1. **`ChatGPT_Image_9_de_jul._de_2026_19_09_58.png`** — "Tudo para sua agenda continuar" → leva pra `/catalogo` (catálogo geral)
2. **`image-3.png`** — "Pede agora e recebe hoje" → leva pra `/catalogo` (catálogo geral, foco em entrega local)
3. **`image-4.png`** — "As queridinhas da lash" (colas) → leva pra `/catalogo?cat=colas` (categoria colas)

### O que vou fazer
1. Subir as 3 imagens como assets via `lovable-assets` (CDN, sem inchar o repo) e gerar os `.asset.json` em `src/assets/`.
2. Editar `src/components/HeroBannerCarousel.tsx`:
   - Remover os imports antigos (`banner-entrega-45min.png`, `banner-master-beauty.jpg`, `hero-banner.jpg`).
   - Importar os 3 novos asset pointers e usar `.url` no `<img src>`.
   - Atualizar `alt` de cada banner (SEO + acessibilidade em PT-BR descrevendo a imagem).
   - Atualizar os `link` de cada slide conforme a tabela acima.
3. Manter o comportamento atual: autoplay 5s, setas no hover, dots, click navega pra rota.
4. Não mexer em nada mais — stickers, WelcomeStrip, Trust Bar, seções, footer permanecem iguais.

### Arquivos afetados
- `src/components/HeroBannerCarousel.tsx` (edição)
- `src/assets/banner-agenda-continuar.png.asset.json` (novo)
- `src/assets/banner-pede-recebe-hoje.png.asset.json` (novo)
- `src/assets/banner-queridinhas-colas.png.asset.json` (novo)

Não vou apagar os banners antigos do disco por enquanto (caso queira reaproveitar em outro lugar), mas eles saem do carrossel.
