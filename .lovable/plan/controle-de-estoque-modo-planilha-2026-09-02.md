# Controle de Estoque (modo planilha)

Nova página no painel: **Estoque**, logo abaixo de Produtos no menu lateral. É uma tabela editável estilo Excel, ligada aos mesmos produtos da loja — o que for alterado ali aparece no produto, e o que for alterado no produto aparece ali.

## O que a página faz

- **Tabela de todos os produtos** (ativos primeiro, depois inativos, em ordem alfabética), com colunas: Produto, Categoria, Preço, Estoque, Status (ativo/inativo).
- **Edição direta na célula**: clica no número do estoque ou no preço, digita e salva ao sair do campo (ou Enter). Salvamento automático com aviso "salvo" discreto.
- **Botões rápidos de entrada/saída**: `-1` / `+1` ao lado do estoque e um campo "ajustar" para somar ou subtrair uma quantidade (ex.: chegou 12 unidades → digita +12).
- **Adicionar produto direto na planilha**: linha nova no topo pedindo só nome, categoria, preço e estoque. Entra ativo, com imagem placeholder; foto e descrição podem ser completadas depois na tela de Produtos.
- **Remover**: desativa o produto (some da loja, continua no banco e na planilha na seção de inativos, com botão para reativar).
- **Busca e filtro por categoria**, mais filtros rápidos: "Sem estoque", "Estoque baixo (≤3)", "Só ativos".
- **Resumo no topo**: total de itens ativos, quantos sem estoque, quantos com estoque baixo e valor total do estoque (preço × quantidade).
- **Exportar CSV** da planilha, para conferência offline no Excel.

## Sem histórico de movimentações

Conforme escolhido, a planilha mostra só o estoque atual — não haverá registro de quem alterou nem log de entradas/saídas. Se um dia quiser esse histórico, dá para adicionar depois sem refazer nada.

## Acesso

Sua funcionária usa o mesmo login de admin que você — nada muda no acesso.

## Detalhes técnicos

- Nova rota `/admin/estoque` (`src/pages/admin/AdminStock.tsx`) + item no `AdminSidebar`.
- Usa a função de backend `admin-products` já existente (`list`, `create`, `update`, `delete` = desativar). Nenhuma mudança de schema no banco: `stock`, `price` e `active` já existem na tabela de produtos.
- Salvamento otimista por célula com rollback e toast em caso de erro; slug gerado automaticamente a partir do nome nas novas linhas (sem espaços/acentos).
- Tabela com rolagem horizontal no mobile e cabeçalho fixo, para funcionar bem no celular.
