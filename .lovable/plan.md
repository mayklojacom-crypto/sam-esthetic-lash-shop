## Objetivo

Sincronizar o catálogo com a planilha `controle_estoque_produtos_site_atualizado.xlsx` **sem excluir nem recriar produtos**. Só atualizações + cadastro dos itens que ainda não existem.

## 1. Atualizar estoque + preço (produtos que já existem)

Como a planilha tem um SKU por tamanho e o site tem 1 produto com vários tamanhos, o estoque de cada produto é a **soma das linhas** correspondentes.

| Produto no site | Estoque | Preço |
|---|---|---|
| Cílios 6D - Dece Mars | 20 | 45 |
| Cílios 6D - Dece Mars (Mix) | 3 | 45 |
| Cílios YY Brasileiro - Dece Mars | 16 | 22 |
| Cílios YY Brasileiro - Fadvan | 2 | 22 |
| Cílios YY - Fadvan (Mix 8-12) | 3 | 22 |
| Cílios YY U (Mix) FADVAN | 4 | 22 |
| Cílios YY Marrom - Fadvan (Mix) | 2 | 32 |
| Cílios 3D Duplo | 10 | 40 |
| Cílios 4D Duplo (W 8D) Fadvan | 18 | 45 |
| Cílios 4D (Mix) | 3 | 40 |
| Cílios 5D W - Fadvan | 17 | 43 |
| Cílios 5D W - Fadvan (Mix 8-14) | 4 | 43 |
| Cílios 5D W Marrom - Fadvan (Mix) | 2 | 47 |
| Cílios Maria Sasha 5D M | 11 | 45 |
| Primer Cherry | 2 | 36 |
| Removedor Fummix | 3 | 19 |
| Removedor Nagaraku | 1 | 30 |
| Pisseta | 1 | 14 |
| Pump | 2 | 13 |
| Fita Micropore Branca | 5 | 3 |
| Fita Transpore Transparente | 7 | 4 |
| Fita Japonesa Branca | 1 | 5 |
| Batoque para Flor | 5 | 12 |
| Pads (Pacote) | 4 | 17 |
| Microbrush (Pacote) | 7 | 9 |
| Lip Gloss (Pacote) | 4 | 9 |
| Escovinhas (Pacote) | 3 | 9 |
| Anel com 50 un (Pacote) | 15 | 13 |
| Tesourinha | 1 | 9 |
| Pinça Reta (NH12 Nagaraku) | 4 | 30 |
| Pinça Curvada | 3 | 30 |
| Espelho de Dentista | 2 | 9 |
| Cola Oxe | 4 | 65 |
| Cola Adesivo Elite Premium Hs-16 | 6 | 64 |
| Cola Cherry One 3g | 4 | 62 |

## 2. Cadastrar como novos produtos

Categoria seguindo o padrão atual do site (`cilios`, `liquidos`, `ferramentas`, `pincas`, `colas`, `descartaveis`). Entram **ativos**, com imagem placeholder até você subir a foto no painel.

- Cílios 5D Mix Curvatura M — Dece Mars · 2 un · R$ 46 (`cilios`)
- Cílios LU(M) Mix 8-14 · 2 un · R$ 13 (`cilios`)
- Bruma Cherry · 3 un · R$ 38 (`liquidos`)
- Finalizador Cherry · 1 un · R$ 46 (`liquidos`)
- Espuma Soft Snow Cherry · 1 un · R$ 59 (`liquidos`)
- Nano Mister · 3 un · R$ 20 (`ferramentas`)
- Espelho de Mão Preto · 3 un · R$ 17 (`ferramentas`)
- Ventilador · 2 un · R$ 24 (`ferramentas`)
- Pinça ST-15 Semi Curva — Nagaraku · 2 un · R$ 30 (`pincas`)
- Cola Infinity Cherry · 4 un · R$ 62 (`colas`)

## 3. Produtos ativos fora da planilha

Ficam visíveis, mas com estoque **0** (selo "Esgotado"): **Pinça Nagaraku N-07 Acoplar**. Os produtos já desativados (importações antigas Decemars/Fadvan) não serão tocados.

## Detalhes técnicos

- Tudo feito com comandos de atualização/inserção no banco (`UPDATE` por `slug` e `INSERT` para os novos) — nenhum `DELETE`, nenhum produto recriado, IDs preservados.
- Nenhuma mudança de código é necessária: o site e o painel já leem `price` e `stock` do banco.
- Os novos produtos entram com `image = '/placeholder.svg'`, `weight = 50` e ordenação no fim da categoria; você ajusta foto e descrição pelo painel de Produtos.
