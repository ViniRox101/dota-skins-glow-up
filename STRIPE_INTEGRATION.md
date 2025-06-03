# Integração Stripe com Supabase Edge Functions

Este documento explica como configurar e usar a integração do Stripe com o Supabase Edge Functions para processamento de pagamentos, incluindo PIX e controle de estoque.

## Pré-requisitos

1. Conta no Stripe (pode ser uma conta de teste)
2. Projeto Supabase configurado
3. CLI do Supabase instalada (para deploy das funções)

## Configuração

### 1. Configuração do Stripe

1. Crie uma conta no [Stripe](https://stripe.com/) ou use sua conta existente
2. No Dashboard do Stripe, vá em `Developers` > `API keys` e obtenha:
   - Publishable key (para o frontend)
   - Secret key (para o backend)
3. Ative o PIX: No Dashboard do Stripe, vá em `Settings` > `Payment methods` e ative o PIX para o Brasil

### 2. Configuração das Variáveis de Ambiente

#### Frontend (.env)

Crie ou atualize o arquivo `.env` na raiz do projeto com:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

#### Backend (Supabase Edge Functions)

No painel do Supabase, vá em `Project Settings` > `Edge Functions` > `Environment Variables` e adicione:

- `STRIPE_SECRET_KEY`: Sua chave secreta do Stripe (começa com `sk_test_...`)
- `STRIPE_WEBHOOK_SECRET`: O segredo do seu webhook (gerado na configuração do webhook no Stripe)
- `SUPABASE_URL`: A URL do seu projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Sua chave `service_role` do Supabase

### 3. Deploy das Edge Functions

Use a CLI do Supabase para fazer o deploy das funções:

```bash
supabase functions deploy create-checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 4. Configuração do Webhook no Stripe

1. No Dashboard do Stripe, vá em `Developers` > `Webhooks` > `Add endpoint`
2. URL do Endpoint: Use a URL da sua Edge Function de webhook do Supabase
   - Formato: `https://<SEU_PROJETO_REF>.supabase.co/functions/v1/stripe-webhook`
3. Eventos: Selecione `checkout.session.completed` e outros eventos relevantes
4. Após criar o endpoint, copie o `Signing secret` (começa com `whsec_`) e adicione-o como `STRIPE_WEBHOOK_SECRET` nas variáveis de ambiente do Supabase

## Uso

### Criando uma Sessão de Checkout

Para criar uma sessão de checkout no frontend:

```typescript
const handleCheckout = async (products) => {
  try {
    const response = await fetch('https://esjztlesvoqaquviasxl.supabase.co/functions/v1/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products }),
    });

    const session = await response.json();

    if (session.id) {
      // Redirecionar para o checkout do Stripe
      window.location.href = session.url;
    }
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
  }
};
```

### Testando a Integração

1. Use os [cartões de teste do Stripe](https://stripe.com/docs/testing) para simular pagamentos com cartão
2. Para testar o PIX, o Stripe fornece um QR code de teste que você pode "escanear" para simular o pagamento

## Solução de Problemas

### Erros Comuns

1. **Erro de CORS**: Verifique se a função `create-checkout` está configurada para permitir solicitações de origem cruzada
2. **Erro de Webhook**: Verifique se o segredo do webhook está configurado corretamente
3. **Erro de Chave API**: Verifique se as chaves do Stripe estão configuradas corretamente

### Logs

Para visualizar os logs das Edge Functions:

```bash
supabase functions logs create-checkout
supabase functions logs stripe-webhook
```

## Próximos Passos

1. Implementar a lógica completa para diminuir o estoque após o pagamento
2. Criar páginas de sucesso e cancelamento para feedback ao usuário
3. Implementar um sistema de reconciliação para lidar com falhas do webhook