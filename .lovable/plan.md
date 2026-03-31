

# Importar Catálogo Completo com 45% de Lucro

## Resumo
Extrair todos os produtos dos dois catálogos Word, aplicar 45% de margem sobre o preço de custo, copiar as imagens dos documentos para o projeto, e atualizar `src/data/products.ts` com ~130 novos produtos.

## Fórmula de Preço
`preço de venda = custo × 1.45` (arredondado para .99 ou .50)

Exemplo: Cola HS16 custa R$50 → venda R$72.50

## Novas Categorias
Adicionar ao array `categories`:
- **pincas** — Pinças
- **sobrancelhas** — Sobrancelhas
- **lash-lift** — Lash Lift
- **treino** — Treino

## Produtos Extraídos

### Catálogo Cílios (~40 produtos)
Marcas: Nagaraku, Fadvan, Decemars, Maria Sasha. Inclui variações Individual/Mix, curvaturas D/C/L/M, cores Preto/Marrom, e modelos Y/W 3D-6D.

### Catálogo Acessórios (~90 produtos)
Categorias: Colas (Cherry, Sobelle, Macy, Ôxe), Descartáveis (pads, escovinhas, anéis, microbrush), Ferramentas (higrômetro, pisseta, suportes, espelhos, pinças Nagaraku), Líquidos (espumas, primers, removedores, aceleradores, finalizadores), Sobrancelhas (Depil Bella, hennas Glance/Menela/Della&Delle, ceras), Lash Lift (kits, passos, brow lamination), Treino (cabeça boneca, esponja, suporte facial, cílios treino).

## Alterações Técnicas

### 1. Copiar imagens dos documentos
- Copiar ~130 imagens de `parsed-documents://` para `public/products/`
- Nomear com slugs consistentes (ex: `nagaraku-volume-russo-individual.jpg`)

### 2. Atualizar `src/data/products.ts`
- Adicionar 4 novas categorias
- Atualizar preços dos 10 produtos existentes com base nos custos reais dos catálogos + 45%
- Adicionar ~120 novos produtos com: id, slug, name, price (custo×1.45), image, category, description, sizes (quando aplicável), weight
- Marcar os mais populares como `featured: true`

### 3. Atualizar `public/sitemap.xml`
- Adicionar URLs das novas páginas de produto

## Produtos Existentes que Serão Atualizados
| Produto | Preço Atual | Custo Catálogo | Novo Preço (×1.45) |
|---------|------------|----------------|-------------------|
| Cola HS16 3ml | R$63.99 | R$50 | R$72.50 |
| Pads Gel 50 pares | R$18.50 | R$10 | R$14.50 |
| Microbrush 50 uni | R$8.99 | R$3.50 | R$5.08 |
| Aplicador Gloss 50 uni | R$8.99 | R$3.50 | R$5.08 |
| Anel Batoque 50 uni | R$13.00 | R$9 | R$13.05 |
| Fita Transpore | R$4.00 | R$3 | R$4.35 |

**Nota importante:** Alguns preços atuais no site (ex: Microbrush R$8.99) ficariam menores com a fórmula de 45% (R$5.08). Preciso de confirmação se devo manter os preços atuais maiores ou substituir pelo cálculo de 45%.

## Observação sobre Imagens
As imagens extraídas dos documentos Word são fotos de catálogo. Serão usadas como placeholder. Você pode substituí-las depois por fotos profissionais de melhor qualidade.

