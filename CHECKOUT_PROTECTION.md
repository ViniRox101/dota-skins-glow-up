# ⚠️ PROTEÇÃO DO FLUXO DE CHECKOUT - LEIA ANTES DE FAZER ALTERAÇÕES

## 🚨 ATENÇÃO: COMPONENTES CRÍTICOS DO SISTEMA DE PAGAMENTO

Este documento lista todos os arquivos e funções **CRÍTICOS** para o funcionamento do checkout e pagamentos via Stripe. **NÃO REMOVA, ALTERE OU REFATORE** estes componentes sem extremo cuidado.

### 📋 ARQUIVOS PROTEGIDOS

#### 1. Frontend - Botão de Checkout
- **Arquivo**: `src/pages/CartPage.tsx`
- **Função crítica**: `handleCheckout`
- **Botão crítico**: "Finalizar Compra"
- **⚠️ NÃO ALTERAR**: 
  - `onClick={handleCheckout}`
  - `disabled={isProcessingCheckout || cartItems.length === 0}`
  - Texto "Finalizar Compra"
  - Estado `isProcessingCheckout`

#### 2. Serviço de Pagamento
- **Arquivo**: `src/services/paymentService.ts`
- **Função crítica**: `createPaymentPreference`
- **⚠️ NÃO ALTERAR**: Esta função é chamada diretamente pelo botão "Finalizar Compra"

#### 3. Serviço Stripe
- **Arquivo**: `src/services/stripeService.ts`
- **Funções críticas**:
  - `processCheckout` - Função principal do checkout
  - `createCheckoutSession` - Cria sessão no Stripe
  - `redirectToCheckout` - Redireciona para pagamento
- **⚠️ NÃO ALTERAR**: Qualquer modificação pode quebrar o fluxo de pagamento

#### 4. Edge Functions (Supabase)
- **Arquivo**: `supabase/functions/create-checkout-session/index.ts`
- **Função**: Cria sessões de checkout no Stripe
- **⚠️ NÃO ALTERAR**: Essencial para comunicação com API do Stripe

- **Arquivo**: `supabase/functions/stripe-webhook/index.ts`
- **Função**: Processa webhooks do Stripe
- **⚠️ NÃO ALTERAR**: Confirma pagamentos e atualiza pedidos

### 🔄 FLUXO COMPLETO DO CHECKOUT

1. **Usuário clica em "Finalizar Compra"** (`CartPage.tsx`)
2. **Chama `handleCheckout`** → **`paymentService.createPaymentPreference`**
3. **Chama `stripeService.processCheckout`**
4. **Cria sessão via Edge Function** (`create-checkout-session`)
5. **Redireciona para Stripe** (`redirectToCheckout`)
6. **Webhook confirma pagamento** (`stripe-webhook`)

### 🚫 O QUE NÃO FAZER

- ❌ Remover ou renomear a função `handleCheckout`
- ❌ Alterar o `onClick` do botão "Finalizar Compra"
- ❌ Modificar as validações `disabled` do botão
- ❌ Alterar o texto "Finalizar Compra"
- ❌ Refatorar `paymentService.createPaymentPreference`
- ❌ Modificar as Edge Functions sem testar
- ❌ Alterar configurações do Stripe
- ❌ Remover logs de debug do checkout

### ✅ COMO FAZER ALTERAÇÕES SEGURAS

1. **Sempre teste o checkout completo** após qualquer mudança
2. **Mantenha backups** dos arquivos críticos
3. **Teste em ambiente de desenvolvimento** primeiro
4. **Verifique logs do Stripe** para erros
5. **Confirme que webhooks funcionam** após alterações

### 🐛 PROBLEMAS CONHECIDOS

- **Botão para de funcionar intermitentemente**
  - Causa: Possível interferência de outros componentes
  - Solução: Verificar se `handleCheckout` não foi alterado
  - Verificar se `isProcessingCheckout` está funcionando

### 📞 EM CASO DE PROBLEMAS

1. Verificar console do navegador para erros JavaScript
2. Verificar logs das Edge Functions no Supabase
3. Verificar dashboard do Stripe para sessões criadas
4. Confirmar que variáveis de ambiente estão corretas

---

**⚠️ LEMBRE-SE: O sistema de pagamento é a parte mais crítica da aplicação. Qualquer erro pode resultar em perda de vendas e problemas com clientes.**

**📅 Última atualização**: Janeiro 2025
**🔒 Status**: PROTEGIDO - NÃO ALTERAR SEM AUTORIZAÇÃO