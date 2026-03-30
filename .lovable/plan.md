

# Integração Mercado Pago + PDF do Pedido via WhatsApp

## Pré-requisito

Antes de implementar, precisamos **ativar o Lovable Cloud/Supabase** no projeto. Sem isso, não é possível criar Edge Functions para processar o pagamento de forma segura. O Access Token do Mercado Pago **nunca** pode ficar exposto no frontend.

## Arquitetura

```text
[Cliente preenche dados] → [Escolhe: Mercado Pago ou WhatsApp]
         ↓ (Mercado Pago)
[Edge Function: create-mp-preference]
         ↓
[API Mercado Pago → gera link de pagamento]
         ↓
[Cliente paga (Pix/Cartão/Boleto)]
         ↓
[Retorna à loja → /pagamento/status]
         ↓
[Edge Function: generate-order-pdf]
         ↓
[Gera PDF do pedido + Envia link do PDF via WhatsApp para você]
```

## Etapas

### 1. Ativar Lovable Cloud
- Habilitar backend para ter Edge Functions e armazenamento seguro de secrets.

### 2. Armazenar credenciais como secrets
- `MP_ACCESS_TOKEN` — Access Token fornecido
- `MP_PUBLIC_KEY` — Public Key (pode ficar no frontend para SDK)

### 3. Edge Function `create-mp-preference`
- Recebe itens do carrinho + dados do cliente
- Valida com Zod
- Chama `POST https://api.mercadopago.com/checkout/preferences`
- Configura `back_urls` para página de retorno da loja
- Retorna `init_point` (URL de pagamento)

### 4. Edge Function `generate-order-pdf`
- Recebe dados do pedido (itens, cliente, payment_id)
- Gera PDF profissional com: logo, dados do cliente, lista de itens, total, status do pagamento
- Salva o PDF no Supabase Storage
- Envia mensagem no WhatsApp (5562998755213) com link do PDF usando a API do WhatsApp

### 5. Atualizar Checkout
- Dois botões: "Pagar com Mercado Pago" e "Enviar via WhatsApp"
- Mercado Pago: chama edge function → redireciona para pagamento
- WhatsApp: mantém o fluxo atual

### 6. Nova página `/pagamento/status`
- Lê query params retornados pelo Mercado Pago (`status`, `payment_id`)
- Se aprovado: chama edge function para gerar PDF e enviar no WhatsApp
- Mostra feedback visual (sucesso/pendente/falha)
- Limpa carrinho em caso de sucesso

### 7. Nova rota no App.tsx
- Adicionar `/pagamento/status` → componente `PaymentStatus`

## Credenciais recebidas
- Public Key: `APP_USR-b31e9fe3-...` (vai no frontend para SDK)
- Access Token: `APP_USR-487365...` (secret, apenas na Edge Function)
- Client ID e Client Secret: backup para webhook futuro

## Resultado final
Após o cliente pagar, você recebe no seu WhatsApp um PDF profissional com todos os detalhes do pedido para dar sequência.

