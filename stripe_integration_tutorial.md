## Tutorial de Integração e Funcionalidades do Cliente

Este tutorial abrange a criação da autenticação para usuários padrão, a página de perfil do cliente e a integração de pagamentos via Stripe com PIX e controle de estoque.

### Parte 1: Autenticação de Usuários Padrão e Perfil do Cliente

#### 1.1. Configuração da Autenticação no Supabase

(Detalhes sobre como configurar a autenticação de usuários padrão no Supabase, incluindo tabelas, RLS, etc.)

#### 1.2. Implementação do Fluxo de Autenticação no Frontend

(Detalhes sobre como usar o cliente Supabase no React para login, cadastro, logout, etc.)

#### 1.3. Criação da Página de Perfil do Cliente

(Detalhes sobre como criar a página de perfil, buscar dados do usuário, exibir histórico de compras, etc.)

### Parte 2: Integração Stripe com PIX e Controle de Estoque

Este tutorial detalha os passos para integrar o Stripe em sua aplicação React/Supabase, permitindo pagamentos via PIX e a diminuição automática do estoque após a confirmação do pagamento.

### 2. Configuração Inicial do Stripe

1.  **Crie uma Conta Stripe:** Se ainda não tiver, crie uma conta em [Stripe](https://stripe.com/).
2.  **Obtenha suas Chaves de API:** No Dashboard do Stripe, vá em `Developers` > `API keys`. Você precisará da sua `Publishable key` (para o frontend) e da sua `Secret key` (para o backend).
3.  **Ative o PIX:** No Dashboard do Stripe, vá em `Settings` > `Payment methods` e ative o PIX para o Brasil.

### 2. Configuração do Frontend (React)

#### 2.1. Instalação das Dependências

Instale as bibliotecas necessárias:

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
# ou
yarn add @stripe/react-stripe-js @stripe/stripe-js
```

#### 2.2. Inicialização do Stripe

No seu `main.tsx` ou no componente raiz da sua aplicação, envolva-a com `Elements` do Stripe:

```typescript:src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Substitua 'SUA_CHAVE_PUBLICAVEL_STRIPE' pela sua chave publicável do Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
  </React.StrictMode>,
);
```

Adicione `VITE_STRIPE_PUBLISHABLE_KEY` ao seu arquivo `.env`:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_PUBLICAVEL_AQUI
```

#### 2.3. Criação de uma Sessão de Checkout

Crie um componente de checkout (ex: `CheckoutForm.tsx`) que irá interagir com o backend para criar uma sessão de checkout do Stripe.

```typescript:src/components/CheckoutForm.tsx
import React from 'react';
import { useStripe } from '@stripe/react-stripe-js';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutFormProps {
  products: Product[];
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ products }) => {
  const stripe = useStripe();

  const handleCheckout = async () => {
    if (!stripe) {
      // Stripe.js ainda não carregou.
      // Certifique-se de que o componente está dentro de <Elements>.
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });

      const session = await response.json();

      if (session.id) {
        const result = await stripe.redirectToCheckout({
          sessionId: session.id,
        });

        if (result.error) {
          alert(result.error.message);
        }
      }
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      alert('Ocorreu um erro ao iniciar o checkout.');
    }
  };

  return (
    <button onClick={handleCheckout} disabled={!stripe}>
      Pagar com Stripe
    </button>
  );
};

export default CheckoutForm;
```

### 3. Configuração do Backend (Supabase Edge Functions)

Vamos usar uma Supabase Edge Function para criar a sessão de checkout e lidar com os webhooks do Stripe. Isso garante que sua `Secret Key` do Stripe nunca seja exposta no frontend.

#### 3.1. Crie uma Edge Function para Checkout

Crie um novo arquivo para sua Edge Function (ex: `supabase/functions/create-checkout-session/index.ts`).

```typescript:supabase/functions/create-checkout-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.1.0?target=deno&deno-std=0.168.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }});
  }

  try {
    const { products } = await req.json();

    const line_items = products.map((product: any) => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: product.name,
        },
        unit_amount: product.price * 100, // Stripe espera o valor em centavos
      },
      quantity: product.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'], // Habilita cartão e PIX
      line_items,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cancel`,
    });

    return new Response(JSON.stringify({ id: session.id }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    });
  }
});
```

#### 3.2. Crie uma Edge Function para Webhooks

Crie um novo arquivo para sua Edge Function de webhook (ex: `supabase/functions/stripe-webhook/index.ts`).

```typescript:supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.1.0?target=deno&deno-std=0.168.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') as string,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string,
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string;

  try {
    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature!, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Lógica para diminuir o estoque e registrar o pedido
        console.log('Sessão de checkout concluída:', session.id);

        // Exemplo: Obter itens da sessão e atualizar o estoque no Supabase
        // Você precisará de uma tabela 'products' com uma coluna 'stock'
        // e uma tabela 'orders' para registrar as compras.

        // const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        // for (const item of lineItems.data) {
        //   const productId = item.price?.product as string; // Ou de onde você obtiver o ID do produto
        //   const quantity = item.quantity || 0;
        //   await supabaseAdmin.from('products').rpc('decrement_stock', { product_id: productId, quantity_to_decrement: quantity });
        // }

        // Exemplo de função RPC para decrementar estoque (você precisaria criar isso no Supabase)
        /*
        CREATE OR REPLACE FUNCTION decrement_stock(product_id uuid, quantity_to_decrement int) RETURNS void LANGUAGE plpgsql AS $$
        BEGIN
          UPDATE products
          SET stock = stock - quantity_to_decrement
          WHERE id = product_id;
        END;
        $$;
        */

        break;
      // Outros eventos do Stripe que você queira lidar
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro no webhook do Stripe:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

#### 3.3. Variáveis de Ambiente no Supabase

No seu projeto Supabase, vá em `Project Settings` > `Edge Functions` > `Environment Variables` e adicione:

*   `STRIPE_SECRET_KEY`: Sua chave secreta do Stripe (começa com `sk_test_...`).
*   `STRIPE_WEBHOOK_SECRET`: O segredo do seu webhook (gerado na configuração do webhook no Stripe).
*   `SUPABASE_URL`: A URL do seu projeto Supabase.
*   `SUPABASE_SERVICE_ROLE_KEY`: Sua chave `service_role` do Supabase (encontrada em `Project Settings` > `API`).

#### 3.4. Deploy das Edge Functions

Implante suas Edge Functions usando a CLI do Supabase:

```bash
supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 4. Configuração do Webhook no Stripe

1.  **Adicione um Endpoint de Webhook:** No Dashboard do Stripe, vá em `Developers` > `Webhooks` > `Add endpoint`.
2.  **URL do Endpoint:** Use a URL da sua Edge Function de webhook do Supabase. Será algo como `https://<SEU_PROJETO_REF>.supabase.co/functions/v1/stripe-webhook`.
3.  **Eventos:** Selecione os eventos que você deseja receber. Para este tutorial, `checkout.session.completed` é essencial. Você pode adicionar outros como `payment_intent.succeeded`, `charge.succeeded`, etc.
4.  **Obtenha o Segredo do Webhook:** Após criar o endpoint, o Stripe fornecerá um `Signing secret` (começa com `wh_`). Copie-o e adicione-o como `STRIPE_WEBHOOK_SECRET` nas variáveis de ambiente do Supabase.

### 5. Testando a Integração

1.  Inicie sua aplicação React.
2.  Clique no botão de checkout.
3.  Você será redirecionado para a página de checkout do Stripe.
4.  Use os [cartões de teste do Stripe](https://stripe.com/docs/testing) ou simule um pagamento PIX.
5.  Após a conclusão do pagamento, o webhook será disparado para sua Edge Function, que deverá diminuir o estoque e registrar o pedido.

### 6. Próximos Passos e Melhorias

*   **Página de Sucesso/Cancelamento:** Crie as páginas `success.tsx` e `cancel.tsx` para feedback ao usuário.
*   **Tratamento de Erros:** Melhore o tratamento de erros no frontend e backend.
*   **Persistência de Pedidos:** Implemente a lógica completa para salvar os detalhes do pedido no Supabase.
*   **Segurança:** Revise as políticas de RLS (Row Level Security) no Supabase para suas tabelas de produtos e pedidos.
*   **Reconciliação:** Implemente um mecanismo para reconciliar pedidos em caso de falha do webhook.