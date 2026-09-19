# Cards de produto e galeria com até 3 fotos

## Objetivo
Aproximar os cards do catálogo da referência enviada, mantendo a identidade delicada da Sam Esthetic, e permitir até três imagens por produto.

## Alterações
- Reorganizar o card com foto ampla, nome centralizado, preço em destaque, desconto/parcelamento, controle de quantidade e botão principal “Adicionar”.
- Manter o estado “Esgotado” e encaminhar produtos com variações para a página de escolha.
- Adicionar no painel três espaços de imagem por produto, com envio, visualização e remoção independentes.
- Salvar as imagens adicionais junto ao produto no banco, preservando a imagem atual como principal.
- Criar uma galeria na página do produto com foto principal e miniaturas para alternar entre as imagens.
- Garantir compatibilidade com produtos antigos que possuem somente uma foto.

## Detalhes técnicos
- Nova coluna `images` com lista de URLs na tabela de produtos.
- O primeiro item da lista será a imagem principal usada nos cards.
- Limite de três imagens, com nomes de arquivo seguros no envio.
- Ajustes nos tipos e no mapeamento de dados usados pelo catálogo.
- Validação visual em celular e desktop, além da verificação automática do projeto.
