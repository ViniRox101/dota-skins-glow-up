# Integração Mercado Pago - Dota Skins Glow Up

## 📋 Resumo da Migração

Este projeto foi migrado do Stripe para o Mercado Pago para oferecer uma melhor experiência de pagamento para usuários brasileiros.

## 🔧 Configuração

### Variáveis de Ambiente

As seguintes chaves do Mercado Pago devem estar configuradas no arquivo `.env`:

```env
# Mercado Pago - Chaves de API
MERCADOPAGO_PUBLIC_KEY=your_public_key_here
MERCADOPAGO_ACCESS_TOKEN=your_access_token_here

# URL do site para redirecionamentos
SITE_URL=http://localhost:8081
```

**⚠️ IMPORTANTE:** As chaves do Mercado Pago estão configuradas no arquivo `.env` do projeto.

### Webhook Configuration

O webhook do Mercado Pago está configurado na URL:
```
https://esjztlesvoqaquviasxl.supabase.co/functions/v1/mercadopago-webhook
```

## 🏗️ Arquitetura

### Edge Functions (Supabase)

1. **`mercadopago-webhook`** - Processa notificações do Mercado Pago
   - Localização: `supabase/functions/mercadopago-webhook/index.ts`
   - Função: Recebe webhooks de pagamento e atualiza status dos pedidos
   - Status: ✅ Deployed

2. **`create-payment-preference`** - Cria preferências de pagamento
   - Localização: `supabase/functions/create-payment-preference/index.ts`
   - Função: Cria preferências de pagamento no Mercado Pago
   - Status: ✅ Deployed

### Serviços Frontend

1. **`mercadopagoService.ts`** - Serviço principal do Mercado Pago
   - Localização: `src/services/mercadopagoService.ts`
   - Função: Interface entre frontend e API do Mercado Pago
   - Status: ✅ Criado

2. **`paymentService.ts`** - Serviço de pagamentos (migrado)
   - Localização: `src/services/paymentService.ts`
   - Função: Serviço principal chamado pelo frontend
   - Status: ✅ Migrado para Mercado Pago

## 🔄 Fluxo de Pagamento

### 1. Iniciação do Checkout
```typescript
// O usuário clica em "Finalizar Compra"
paymentService.createPaymentPreference(items)
```

### 2. Criação da Preferência
```typescript
// Chama a Edge Function para criar preferência
const response = await supabase.functions.invoke('create-payment-preference', {
  body: { items, userEmail, userId }
})
```

### 3. Redirecionamento
```typescript
// Redireciona para o checkout do Mercado Pago
window.location.href = preference.init_point
```

### 4. Processamento do Webhook
```typescript
// Mercado Pago envia notificação para o webhook
// Webhook atualiza status do pedido no banco de dados
```

## 📊 Status de Pagamento

### Mapeamento de Status

| Mercado Pago | Sistema Interno | Descrição |
|--------------|-----------------|-----------|
| `approved` | `paid` | Pagamento aprovado |
| `pending` | `pending` | Pagamento pendente |
| `in_process` | `pending` | Processando pagamento |
| `rejected` | `failed` | Pagamento rejeitado |
| `cancelled` | `cancelled` | Pagamento cancelado |
| `refunded` | `refunded` | Pagamento estornado |
| `charged_back` | `disputed` | Chargeback |

## 🗄️ Estrutura do Banco de Dados

### Tabela `orders`
```sql
- id (string) - Referência externa do pedido
- user_id (string) - ID do usuário
- user_email (string) - Email do usuário
- items (json) - Itens do pedido
- total_amount (decimal) - Valor total
- currency (string) - Moeda (BRL)
- status (string) - Status do pedido
- payment_method (string) - Método de pagamento
- preference_id (string) - ID da preferência MP
- payment_id (string) - ID do pagamento MP
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabela `webhook_events`
```sql
- type (string) - Tipo do evento
- data (json) - Dados do evento
- processed_at (timestamp)
```

## 🔐 Segurança

### Verificação de Webhook
- ⚠️ **TODO:** Implementar verificação de assinatura do webhook
- Atualmente aceita todos os webhooks (não recomendado para produção)

### Variáveis de Ambiente
- Chaves sensíveis armazenadas em `.env`
- Não commitadas no repositório
- Configuradas no Supabase para as Edge Functions

## 🧪 Testes

### URLs de Teste
- **Webhook:** `https://esjztlesvoqaquviasxl.supabase.co/functions/v1/mercadopago-webhook`
- **Create Preference:** `https://esjztlesvoqaquviasxl.supabase.co/functions/v1/create-payment-preference`

### Ambiente de Desenvolvimento
- Usar chaves de sandbox do Mercado Pago
- Testar fluxo completo de pagamento
- Verificar logs no Supabase Dashboard

## 📝 Próximos Passos

1. **Implementar verificação de assinatura do webhook**
2. **Adicionar tratamento de erros mais robusto**
3. **Implementar retry logic para webhooks**
4. **Adicionar logs mais detalhados**
5. **Configurar monitoramento de pagamentos**

## 🚀 Deploy

As Edge Functions foram deployadas usando o MCP do Supabase:
- `mercadopago-webhook`: ✅ Ativo
- `create-payment-preference`: ✅ Ativo

## 📞 Suporte

Para dúvidas sobre a integração:
1. Verificar logs no Supabase Dashboard
2. Consultar documentação do Mercado Pago
3. Verificar configuração das variáveis de ambiente

---

**Status da Migração:** ✅ Completa
**Data:** Janeiro 2025
**Versão:** 1.0.0