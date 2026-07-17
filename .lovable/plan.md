## Objetivo
Fazer com que os produtos vinculados ao post apareçam **estrategicamente dentro do corpo do texto**, não só no final — de forma automática, sem o admin precisar mexer em nada.

## Como vai funcionar (visão do usuário)

- No editor do blog, você continua marcando os produtos indicados normalmente (nada muda no admin).
- Ao abrir o post, o site vai **ler o conteúdo**, identificar bons "pontos de respiro" no meio da leitura e **injetar cards de produto ali dentro**, como uma sugestão fofinha estilo: *"Ah, e olha esse aqui que combina com o que a gente tá falando 💗"*.
- No final do post, continuam aparecendo os demais produtos numa seção "produtos que a gente indica" — mas sem repetir os que já apareceram inline.

## Estratégia de inserção (automática)

O componente `BlogPost` vai:

1. Fazer o parse do HTML do post em blocos (parágrafos, headings, listas, etc.).
2. Escolher pontos de inserção usando estas regras:
   - Nunca antes do 2º parágrafo (deixa o leitor engajar primeiro).
   - Preferir inserir **logo após um `<h2>`** ou depois de parágrafos longos (>350 caracteres).
   - Espaçar as inserções (mínimo 3 blocos entre uma e outra).
   - Máx. 1 produto inline a cada ~4 parágrafos, limite total = nº de produtos vinculados ou 3, o que for menor.
3. Distribuir os produtos vinculados nesses pontos, em ordem.
4. Renderizar cada produto inline como um **"card de indicação"** compacto e temático (não o `ProductCard` padrão, pra não parecer banner de anúncio):
   - Fundo lilás suave + borda tracejada rosinha
   - Miniatura + nome + preço + botão "ver produto"
   - Rótulo fofo tipo *"a queridinha pra isso 💗"* / *"dica da Sam"*

## Onde muda o código

- **`src/pages/BlogPost.tsx`** — trocar o `dangerouslySetInnerHTML` único por uma renderização em blocos que intercala os cards inline. A seção "produtos que a gente indica" no final passa a mostrar só os que **não** foram usados inline (se sobrarem).
- **Novo `src/components/InlineProductPickCard.tsx`** — card compacto de indicação usado dentro do artigo.
- **Nova util `src/lib/blogInlineProducts.ts`** — função pura que recebe o HTML + lista de produtos e devolve um array `[{ type: 'html', html } | { type: 'product', product }]` já intercalado, aplicando as regras acima. Fácil de ajustar depois.

Nada muda no banco, no editor do admin, nem em outras páginas.

## Ponto de decisão (rápido)

Rótulo dos cards inline — qual prefere?
- **A)** *"a queridinha pra isso 💗"* (mais girly, combina com o tom do site)
- **B)** *"dica da Sam"* (mais pessoal/autoridade)
- **C)** *"produto que combina"* (mais neutro)

Se não responder, sigo com **A**.
