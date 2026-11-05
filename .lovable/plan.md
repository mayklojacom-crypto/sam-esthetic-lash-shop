# Distribuição do P0 para samestheticlash.shop — diagnóstico (somente leitura)

## Respostas

**1. Repositório GitHub usado**
Não dá para identificar daqui. O único repositório que o projeto mostra é o armazenamento interno do Lovable, não um GitHub. A ligação com o GitHub só aparece em Configurações do projeto → Git, e eu não tenho acesso a essa tela. As conversas antigas dizem que o Andre usa "dois GitHubs", mas não dizem quais são.

**2. Processo atual para atualizar a Hostinger**
O projeto não tem nenhum envio automático configurado. Pelo histórico, o caminho é manual: o código chega a um GitHub do Andre, a versão final é gerada (`dist/`) e enviada para a pasta `public_html` da Hostinger. A versão final já inclui um arquivo `.htaccess`, que faz as páginas abrirem direto pelo endereço. A data de atualização do domínio (24/10/2026) confirma que o último envio foi feito por fora do Lovable.

**3. Consigo distribuir para o domínio?**
Não. Eu não tenho acesso à Hostinger nem aos GitHubs do Andre. Publicar pelo Lovable só atualiza lash-glam-shop.lovable.app.

**4. Histórico ou documentação de deploy**
Não existe um documento de deploy. Há apenas trechos espalhados:
- conversas antigas (correção do erro ao voltar de página na Hostinger; regra "o Andre distribui pelo GitHub/Hostinger");
- uma anotação no projeto dizendo que o endereço oficial é samestheticlash.shop e que o envio é feito pelo Andre;
- citações nos arquivos `roadmap.md`, `checkout-audit.md` e `payment-verification.md`.

## Ponto a confirmar: o que é "Carrossel"
"Carrossel segue sem publicar" pode ser duas coisas:
- **(a)** o carrossel do Instagram, que não faz parte do site. Nesse caso, o P0 pode ir inteiro.
- **(b)** o carrossel de banners da página inicial. Ele faz parte do P0, porque é a correção dos banners quebrados. Deixá-lo de fora exigiria uma versão separada, sem essa correção.

## Próximos passos depois da confirmação
1. O Andre confere em Configurações do projeto → Git qual GitHub está ligado (código `cbe6ae3`).
2. Se for o caso (b), eu preparo uma versão sem a mudança do carrossel de banners.
3. O Andre gera a versão final (`npm ci && npm run build`) e envia o conteúdo de `dist/` para o `public_html` da Hostinger.
4. Eu confiro o domínio: data de atualização nova, páginas `/entrega`, `/privacidade` e `/trocas-e-devolucoes` abrindo, banners carregando.
