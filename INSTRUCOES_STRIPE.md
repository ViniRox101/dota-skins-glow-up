# Instruções para Resolver Problemas da Integração Stripe

## Problemas Identificados

Os seguintes problemas foram identificados no projeto:

1. As pastas das funções Supabase estavam vazias:
   - `supabase/functions/create-checkout`
   - `supabase/functions/stripe-webhook`

2. Erros de importação nos arquivos TypeScript:
   - Módulos não encontrados como `@/lib/client`, `https://deno.land/std@0.168.0/http/server.ts`, etc.

## Soluções Implementadas

1. Criação das funções Supabase necessárias:
   - Função `create-checkout` para criar sessões de checkout do Stripe
   - Função `stripe-webhook` para processar webhooks do Stripe

2. Criação de componentes e páginas para o frontend:
   - Componente `StripeCheckout` para iniciar o processo de checkout
   - Páginas `success.tsx` e `cancel.tsx` para feedback após o pagamento

3. Criação de arquivos de configuração e documentação:
   - `.env.local.example` para as variáveis de ambiente necessárias
   - `STRIPE_INTEGRATION.md` com instruções detalhadas

## Próximos Passos

Para finalizar a configuração e resolver os problemas, siga estas etapas:

### 1. Configurar as Variáveis de Ambiente

#### No Supabase

1. Acesse o painel do Supabase e vá em `Project Settings` > `Edge Functions` > `Environment Variables`
2. Adicione as seguintes variáveis:
   - `STRIPE_SECRET_KEY`: Sua chave secreta do Stripe
   - `STRIPE_WEBHOOK_SECRET`: O segredo do webhook do Stripe
   - `SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase

#### No Frontend

1. Crie um arquivo `.env.local` na raiz do projeto baseado no `.env.local.example`
2. Adicione sua chave publicável do Stripe:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publicavel
   ```

### 2. Fazer o Deploy das Funções Supabase

1. Instale a CLI do Supabase se ainda não tiver:
   ```bash
   npm install -g supabase
   ```

2. Faça login na CLI do Supabase:
   ```bash
   supabase login
   ```

3. Vincule seu projeto local ao projeto Supabase:
   ```bash
   supabase link --project-ref esjztlesvoqaquviasxl
   ```

4. Faça o deploy das funções:
   ```bash
   supabase functions deploy create-checkout --no-verify-jwt
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

### 3. Configurar o Webhook no Stripe

1. No Dashboard do Stripe, vá em `Developers` > `Webhooks` > `Add endpoint`
2. URL do Endpoint: `https://esjztlesvoqaquviasxl.supabase.co/functions/v1/stripe-webhook`
3. Eventos: Selecione `checkout.session.completed` e outros eventos relevantes
4. Copie o `Signing secret` e adicione-o como `STRIPE_WEBHOOK_SECRET` nas variáveis de ambiente do Supabase

### 4. Testar a Integração

1. Execute a aplicação localmente:
   ```bash
   npm run dev
   ```

2. Navegue até uma página de produto e clique em "Finalizar Compra"
3. Você será redirecionado para a página de checkout do Stripe
4. Use os [cartões de teste do Stripe](https://stripe.com/docs/testing) para simular um pagamento
5. Após o pagamento, você será redirecionado para a página de sucesso

## Solução de Problemas

### Erro: Cannot find module '@/lib/client'

Este erro ocorre porque o módulo não existe. As funções Supabase usam o ambiente Deno, que tem um sistema de importação diferente do Node.js. As importações nas funções Supabase devem usar URLs completas, como:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.1.0?target=deno&deno-std=0.168.0';
```

### Erro: Cannot find name 'Deno'

Este erro ocorre porque o TypeScript não reconhece o objeto global `Deno`. As funções Supabase usam o runtime Deno, que é diferente do Node.js. Para resolver este problema, você pode adicionar um arquivo de declaração de tipos para o Deno ou ignorar os erros durante o desenvolvimento, já que eles não afetarão o funcionamento das funções quando implantadas.

## Recursos Adicionais

- [Documentação do Stripe](https://stripe.com/docs)
- [Documentação do Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Guia de Integração do Stripe com Supabase](https://supabase.com/partners/integrations/stripe)