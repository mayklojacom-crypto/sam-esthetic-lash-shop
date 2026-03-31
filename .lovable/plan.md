

# Checkout Transparente com Pix — Sam Esthetic

## Problema Atual
Hoje o checkout redireciona o cliente para o Mercado Pago (Checkout Pro via `init_point`). Quando o cliente paga por Pix, ele sai do site e ao tentar voltar, encontra erro 404. Não vê a página de agradecimento.

## Solução
Implementar **Checkout Transparente** com Pix diretamente no site, sem sair da Sam Esthetic. O fluxo será:

1. Cliente preenche dados → clica "Pagar com Pix"
2. Edge function cria o pagamento via API `/v1/payments` do Mercado Pago (não mais `/checkout/preferences`)
3. Retorna o QR Code (base64) e código Pix Copia e Cola
4. Exibe o QR Code e o código na própria página do checkout
5. Frontend faz polling no status do pagamento a cada 5 segundos
6. Quando aprovado → limpa carrinho → redireciona para `/obrigado`

```text
Checkout → [Pagar com Pix] → Mostra QR Code no site
                                    ↓ (polling)
                              Pagamento aprovado?
                                    ↓ sim
                              Redireciona → /obrigado 🎉
```

## Alterações

### 1. Nova Edge Function `create-pix-payment`
- Recebe: items, customer data
- Cria pagamento via `POST /v1/payments` com `payment_method_id: "pix"`
- Salva pedido no banco (como já faz a `create-mp-preference`)
- Retorna: `payment_id`, `qr_code_base64`, `qr_code` (copia e cola), `ticket_url`

### 2. Nova Edge Function `check-payment-status`
- Recebe: `payment_id`
- Consulta `GET /v1/payments/{id}` no Mercado Pago
- Retorna: `status` (pending, approved, rejected)
- Quando approved, atualiza o pedido no banco e gera o PDF (mesma lógica do webhook)

### 3. Atualizar `src/pages/Checkout.tsx`
- Ao clicar "Pagar com Mercado Pago", chamar `create-pix-payment` em vez de `create-mp-preference`
- Mostrar um modal/seção com:
  - QR Code renderizado (imagem base64)
  - Código Pix Copia e Cola com botão "Copiar"
  - Timer de expiração (30 min)
  - Mensagem "Aguardando pagamento..."
- Iniciar polling via `setInterval` chamando `check-payment-status` a cada 5s
- Quando status = `approved`: limpar carrinho, navegar para `/obrigado?pedido={ref}`
- Quando status = `rejected`: mostrar erro e permitir tentar novamente
- Manter o botão WhatsApp como alternativa

### 4. Manter a Edge Function `mp-webhook` existente
- Continua funcionando como backup (Mercado Pago envia webhook independente)
- Garante que o pedido seja processado mesmo se o polling falhar

## Detalhes Técnicos
- A API de pagamento Pix do Mercado Pago requer: `transaction_amount`, `payment_method_id: "pix"`, `payer.email`, `payer.identification` (CPF)
- O QR Code tem validade padrão de 24h (pode ser configurado via `date_of_expiration`)
- O polling para após 30 minutos ou quando o status muda de `pending`
- Nenhuma biblioteca extra necessária — o QR Code vem como base64 do Mercado Pago

