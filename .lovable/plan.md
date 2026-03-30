

# Integração de Cálculo de Frete via Correios

## Resumo
Criar uma Edge Function que consulta a API dos Correios (ViaCEP + calculador de frete) para retornar valores de PAC e SEDEX com base no CEP do cliente. O frete será exibido no checkout após o preenchimento do CEP.

## Arquitetura

```text
[Cliente digita CEP] → [Edge Function calculate-shipping]
                            ↓
                     [API Correios (PAC/SEDEX)]
                            ↓
                     [Retorna preço + prazo]
                            ↓
              [Exibe opções no checkout]
              [Soma frete ao total do pedido]
```

## O que será feito

### 1. Nova Edge Function `calculate-shipping`
- Recebe: CEP de destino, peso total e dimensões
- CEP de origem fixo (o seu — Goiânia/GO)
- Consulta a API pública dos Correios (via `https://www.correios.com.br/@@precoPrazo`) para PAC (código 04510) e SEDEX (código 04014)
- Retorna: preço e prazo estimado para cada modalidade

### 2. Adicionar peso aos produtos
- Adicionar campo `weight` (em gramas) na interface `Product` em `src/data/products.ts`
- Definir peso padrão para cada produto (ex: cílios ~50g, cola ~100g)

### 3. Atualizar Checkout (`src/pages/Checkout.tsx`)
- Após preenchimento do CEP (8 dígitos), além do ViaCEP, chamar a Edge Function de frete
- Exibir cards com opções: PAC (mais barato, mais lento) e SEDEX (mais rápido)
- Cliente seleciona a modalidade
- Valor do frete somado ao total antes do pagamento

### 4. Atualizar fluxo de pagamento
- Incluir o valor do frete no total enviado ao Mercado Pago
- Adicionar item "Frete (PAC/SEDEX)" na preferência de pagamento
- Salvar informação de frete no pedido (tabela `orders`)

## Detalhes técnicos
- A API pública dos Correios não requer autenticação (sem necessidade de credenciais)
- Dimensões padrão fixas (caixa pequena: 16x11x5cm) adequadas para produtos leves como cílios e acessórios
- Fallback: se a API falhar, exibir mensagem amigável e permitir prosseguir sem cálculo (frete a combinar)

