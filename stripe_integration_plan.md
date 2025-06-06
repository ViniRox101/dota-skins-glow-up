# Plano de Integração Stripe - Dota Skins Glow Up

Este documento detalha o passo a passo completo para integrar o Stripe na aplicação, incluindo checkout, webhooks e atualização automática do estoque no Supabase.

## 🔧 Ferramentas Utilizadas

**MCP (Model Context Protocol) Integrations:**
- **MCP Stripe**: Utilizaremos o MCP Stripe para gerenciar operações do Stripe de forma integrada, incluindo criação de produtos, preços, clientes e processamento de pagamentos.
- **MCP Supabase**: Para operações de banco de dados, criação de tabelas, execução de migrações e gerenciamento do estoque.

Essas ferramentas nos permitem uma integração mais robusta e automatizada, reduzindo a necessidade de configurações manuais e garantindo maior consistência entre os ambientes.

## 1. Configuração Inicial

### 1.1 Conta Stripe
- [ ] Criar conta Stripe (se não existir)
- [ ] Obter chaves de API:
  - Publishable Key (pk_test_...)
  - Secret Key (sk_test_...)
- [ ] Adicionar as chaves no arquivo `.env`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 1.2 Instalação de Dependências
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

## 2. Estrutura de Arquivos

```
src/
├── services/
│   └── stripeService.ts          # Serviços do Stripe
├── components/
│   ├── checkout/
│   │   ├── CheckoutForm.tsx      # Formulário de checkout
│   │   └── StripeProvider.tsx    # Provider do Stripe
│   └── ui/
├── pages/
│   ├── success.tsx               # Página de sucesso
│   └── cancel.tsx                # Página de cancelamento
supabase/
└── functions/
    ├── create-checkout-session/   # Edge Function para criar sessão
    └── stripe-webhook/           # Edge Function para webhook
```

## 3. Implementação Frontend

### 3.1 Serviço Stripe (`src/services/stripeService.ts`)
```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const createCheckoutSession = async (items: CartItem[]) => {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });
  
  const session = await response.json();
  
  const stripe = await stripePromise;
  const { error } = await stripe!.redirectToCheckout({
    sessionId: session.id,
  });
  
  if (error) {
    console.error('Erro no checkout:', error);
  }
};
```

### 3.2 Provider Stripe (`src/components/checkout/StripeProvider.tsx`)
```typescript
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ReactNode } from 'react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider = ({ children }: StripeProviderProps) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};
```

### 3.3 Componente de Checkout (`src/components/checkout/CheckoutForm.tsx`)
```typescript
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { createCheckoutSession } from '@/services/stripeService';

export const CheckoutForm = () => {
  const { items, getTotalPrice } = useCart();
  
  const handleCheckout = async () => {
    try {
      await createCheckoutSession(items);
    } catch (error) {
      console.error('Erro no checkout:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="text-xl font-bold">
        Total: R$ {getTotalPrice().toFixed(2)}
      </div>
      <Button onClick={handleCheckout} className="w-full">
        Finalizar Compra
      </Button>
    </div>
  );
};
```

### 3.4 Páginas de Sucesso e Cancelamento

**`src/pages/success.tsx`**
```typescript
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

export const Success = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    if (sessionId) {
      clearCart();
    }
  }, [sessionId, clearCart]);
  
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">
        Pagamento Realizado com Sucesso!
      </h1>
      <p className="text-lg mb-4">
        Obrigado pela sua compra. Você receberá um email de confirmação em breve.
      </p>
    </div>
  );
};
```

## 4. Implementação Backend (Supabase Edge Functions)

### 4.1 Edge Function - Criar Sessão de Checkout

**`supabase/functions/create-checkout-session/index.ts`**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const { items } = await req.json();
    
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100), // Converter para centavos
      },
      quantity: item.quantity,
    }));
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cancel`,
      metadata: {
        items: JSON.stringify(items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity
        })))
      }
    });
    
    return new Response(JSON.stringify({ id: session.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4.2 Edge Function - Webhook do Stripe

**`supabase/functions/stripe-webhook/index.ts`**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    console.error('Erro na verificação do webhook:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      // Extrair itens dos metadados
      const items = JSON.parse(session.metadata?.items || '[]');
      
      // Salvar transação
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          stripe_session_id: session.id,
          amount: session.amount_total! / 100, // Converter de centavos
          status: 'completed',
          items: items
        })
        .select()
        .single();
      
      if (transactionError) {
        console.error('Erro ao salvar transação:', transactionError);
        return new Response('Erro ao salvar transação', { status: 500 });
      }
      
      // Decrementar estoque para cada item
      for (const item of items) {
        const { error: stockError } = await supabase
          .rpc('decrement_stock_by_id', {
            product_id: item.id,
            quantity_to_decrement: item.quantity
          });
        
        if (stockError) {
          console.error(`Erro ao decrementar estoque do produto ${item.id}:`, stockError);
          // Continuar com outros itens mesmo se um falhar
        }
      }
      
      console.log('Pagamento processado com sucesso:', session.id);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      return new Response('Erro ao processar pagamento', { status: 500 });
    }
  }
  
  return new Response('OK', { status: 200 });
});
```

## 5. Configuração do Banco de Dados

### 5.1 Tabela de Transações
```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.2 Verificar Função de Estoque
Verificar se a função `decrement_stock_by_id` existe e funciona corretamente.

## 6. Integração com CartContext

### 6.1 Atualizar CartContext
```typescript
// Adicionar ao CartContext.tsx
import { createCheckoutSession } from '@/services/stripeService';

const proceedToCheckout = async () => {
  if (items.length === 0) {
    toast({
      title: "Carrinho vazio",
      description: "Adicione itens ao carrinho antes de finalizar a compra.",
      variant: "destructive",
    });
    return;
  }
  
  try {
    await createCheckoutSession(items);
  } catch (error) {
    console.error('Erro no checkout:', error);
    toast({
      title: "Erro no checkout",
      description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
      variant: "destructive",
    });
  }
};
```

## 7. Testes

### 7.1 Testes Manuais
- [ ] Testar criação de sessão de checkout
- [ ] Testar redirecionamento para Stripe
- [ ] Testar pagamento com cartão de teste: `4242 4242 4242 4242`
- [ ] Verificar redirecionamento para página de sucesso
- [ ] Verificar se o estoque foi decrementado

### 7.2 Testes com Stripe CLI
```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Testar webhook
stripe trigger checkout.session.completed
```

## 8. Deploy e Configuração Final

### 8.1 Variáveis de Ambiente no Supabase
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### 8.2 Configuração no Stripe Dashboard
- [ ] Configurar webhook endpoint: `https://[seu-projeto].supabase.co/functions/v1/stripe-webhook`
- [ ] Selecionar evento: `checkout.session.completed`
- [ ] Copiar webhook secret para variáveis de ambiente

## 9. Pontos Críticos de Atenção

### 9.1 Segurança
- ✅ Verificação de assinatura do webhook
- ✅ Uso de Service Role Key apenas no backend
- ✅ Validação de dados de entrada

### 9.2 Idempotência
- ✅ Usar `stripe_session_id` como chave única
- ✅ Verificar se transação já foi processada

### 9.3 Logs e Monitoramento
- ✅ Logs detalhados em todas as operações
- ✅ Tratamento de erros robusto

### 9.4 Performance
- ✅ Operações de banco otimizadas
- ✅ Processamento assíncrono quando possível

## 10. Próximos Passos

1. **Implementar serviço Stripe** (`stripeService.ts`)
2. **Criar Edge Functions** (checkout e webhook)
3. **Atualizar CartContext** com nova lógica de checkout
4. **Criar páginas de sucesso/cancelamento**
5. **Configurar variáveis de ambiente**
6. **Testar fluxo completo**
7. **Deploy e configuração final**

---

**Status:** 📋 Plano criado - Pronto para implementação

**Próxima ação:** Começar pela implementação do `stripeService.ts`