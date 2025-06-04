
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno';

// Inicializar cliente Supabase com variáveis de ambiente
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const stripeWebhookSigningSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET') ?? '';

const supabase = createClient(supabaseUrl, supabaseKey);
const stripeClient = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Configuração CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Lidar com requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signature = req.headers.get('Stripe-Signature');
  const bodyText = await req.text();

  let event: Stripe.Event;

  try {
    if (!signature) {
      console.error('Webhook Error: Missing Stripe-Signature header');
      return new Response('Webhook Error: Missing Stripe-Signature header', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
    if (!stripeWebhookSigningSecret) {
      console.error('Webhook Error: Missing STRIPE_WEBHOOK_SIGNING_SECRET in environment variables.');
      return new Response('Webhook Error: Server configuration error regarding webhook signing secret.', { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    event = await stripeClient.webhooks.constructEventAsync(
      bodyText,
      signature,
      stripeWebhookSigningSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
    console.log('Webhook event verified and constructed:', event.type);

  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook signature verification failed: ${err.message}`, {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }

  try {
    console.log('Webhook processado:', JSON.stringify(event.type));

    // Verificar se é um evento de checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Sessão de checkout completada:', session.id);

      // Verificar se o pagamento foi bem-sucedido
      if (session.payment_status !== 'paid') {
        console.log('Pagamento não foi concluído, ignorando webhook');
        return new Response(JSON.stringify({ success: true, message: 'Pagamento não concluído' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Verificar se o pedido já existe para evitar duplicação
      const { data: existingOrder, error: orderCheckError } = await supabase
        .from('orders')
        .select('*')
        .eq('session_id', session.id)
        .maybeSingle();

      if (orderCheckError) {
        console.error('Erro ao verificar pedido existente:', orderCheckError);
      }

      if (existingOrder) {
        console.log('Pedido já existe, ignorando webhook:', existingOrder.id);
        return new Response(JSON.stringify({ success: true, message: 'Pedido já processado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Buscar itens da sessão
      console.log('Buscando itens da sessão...');
      const lineItems = await stripeClient.checkout.sessions.listLineItems(session.id);
      console.log(`Encontrados ${lineItems.data.length} itens na sessão`);

      // Processar itens do pedido e decrementar estoque
      interface OrderItem {
        product_id: string | null;
        product_name: string;
        price: number;
        quantity: number;
        image_url: string | null;
      }
      const orderItems: OrderItem[] = [];
      let orderTotal = 0;

      for (const item of lineItems.data) {
        try {
          const productName = item.description || '';
          console.log(`Processando item: ${productName}`);

          const stripeLineItemPrice = item.price;
          const stripeProductId = stripeLineItemPrice?.product;
          let supabaseProductId: string | null = null;

          if (typeof stripeProductId === 'string') {
            try {
              console.log(`Tentando buscar produto Stripe com ID: ${stripeProductId}`);
              const stripeProduct = await stripeClient.products.retrieve(stripeProductId);
              console.log('Metadados do produto Stripe:', JSON.stringify(stripeProduct.metadata));
              supabaseProductId = stripeProduct.metadata.supabase_product_id || null;
              console.log(`ID do produto Supabase (via metadata Stripe): ${supabaseProductId}`);
            } catch (e) {
              console.warn(`Não foi possível buscar metadados do produto Stripe ${stripeProductId}:`, e.message);
            }
          }
          
          let product: any = null;

          // Buscar produto no Supabase
          if (supabaseProductId) {
            console.log(`Tentando buscar produto no Supabase por ID: ${supabaseProductId}`);
            const { data: productById, error: productByIdError } = await supabase
              .from('items')
              .select('*')
              .eq('id', supabaseProductId)
              .single();
            if (productByIdError) {
              console.warn(`Erro ao buscar produto por ID ${supabaseProductId} no Supabase:`, productByIdError.message);
            } else {
              product = productById;
            }
          }

          if (!product && productName) {
            console.log(`Produto não encontrado por ID, tentando buscar por nome: ${productName}`);
            const { data: productsByName, error: productByNameError } = await supabase
              .from('items')
              .select('*')
              .eq('nome', productName)
              .limit(1);

            if (productByNameError) {
              console.error(`Erro ao buscar produto "${productName}" por nome:`, productByNameError.message);
            } else if (productsByName && productsByName.length > 0) {
              product = productsByName[0];
              console.log(`Produto encontrado por nome "${productName}":`, product);
            } else {
              console.warn(`Produto "${productName}" não encontrado por nome.`);
            }
          }

          if (product) {
            const itemPrice = item.amount_total / 100;
            orderTotal += itemPrice;

            orderItems.push({
              product_id: product.id,
              product_name: product.nome,
              price: item.price?.unit_amount ? (item.price.unit_amount / 100) : (itemPrice / (item.quantity || 1)),
              quantity: item.quantity || 1,
              image_url: product.imagens && product.imagens.length > 0 ? product.imagens[0] : null,
            });

            // DECREMENTAR ESTOQUE - Esta é a parte principal que estava faltando
            if (typeof product.estoque === 'number') {
              const quantityToDecrement = item.quantity || 1;
              console.log(`Decrementando estoque para produto: ${product.nome} (ID: ${product.id}), Quantidade: ${quantityToDecrement}, Estoque atual: ${product.estoque}`);
              
              try {
                const { data: decrementResult, error: stockError } = await supabase.rpc(
                  'decrement_stock_by_id', 
                  { 
                    p_product_id: product.id, 
                    quantity_to_decrement: quantityToDecrement 
                  }
                );

                if (stockError) {
                  console.error(`Erro ao decrementar estoque para ${product.nome} (ID: ${product.id}):`, stockError);
                } else {
                  console.log(`✅ Estoque decrementado com sucesso para ${product.nome} (ID: ${product.id}). Novo estoque: ${decrementResult}`);
                }
              } catch (stockUpdateError) {
                console.error(`Exceção ao decrementar estoque para ${product.nome} (ID: ${product.id}):`, stockUpdateError);
              }
            } else {
              console.warn(`Estoque não é um número ou não existe para o produto ${product.nome} (ID: ${product.id}). Estoque não decrementado.`);
            }
          } else {
            console.warn(`Produto não encontrado no banco de dados: "${productName}". Adicionando com informações básicas da sessão Stripe.`);
            const itemPrice = item.amount_total / 100;
            orderTotal += itemPrice;

            orderItems.push({
              product_id: null, 
              product_name: productName,
              price: item.price?.unit_amount ? (item.price.unit_amount / 100) : (itemPrice / (item.quantity || 1)),
              quantity: item.quantity || 1,
              image_url: null,
            });
          }
        } catch (itemError) {
          console.error('Erro ao processar item:', itemError);
        }
      }

      // Se não conseguiu processar nenhum item, adicionar um item genérico
      if (orderItems.length === 0) {
        console.warn('Nenhum item processado com sucesso. Adicionando item genérico.');
        const sessionAmount = session.amount_total / 100;
        orderItems.push({
          product_id: null,
          product_name: 'Compra Dota Skins',
          price: sessionAmount,
          quantity: 1,
          image_url: null,
        });
        orderTotal = sessionAmount;
      }

      // Inserir pedido no Supabase
      console.log('Inserindo pedido no Supabase...');
      console.log('Dados do pedido:', {
        session_id: session.id,
        email: session.customer_details?.email,
        total: orderTotal,
        items: orderItems.length
      });
      
      const { data: order, error: insertError } = await supabase
        .from('orders')
        .insert([
          {
            session_id: session.id,
            email: session.customer_details?.email,
            total: orderTotal > 0 ? orderTotal : session.amount_total / 100,
            status: 'completed',
            items: orderItems,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir pedido:', insertError);
        throw new Error(`Falha ao inserir pedido: ${insertError.message}`);
      }

      console.log('✅ Pedido inserido com sucesso e estoque atualizado:', order);

      return new Response(
        JSON.stringify({ success: true, order, message: 'Pedido processado e estoque atualizado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Processar outros eventos do Stripe
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Pagamento bem-sucedido: ${paymentIntent.id} no valor de ${paymentIntent.amount / 100}`)
      
      return new Response(
        JSON.stringify({ success: true, message: 'Pagamento processado com sucesso' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Pagamento falhou: ${paymentIntent.id}, motivo: ${paymentIntent.last_payment_error?.message || 'Desconhecido'}`)
      
      return new Response(
        JSON.stringify({ success: true, message: 'Falha de pagamento registrada' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Responder a outros eventos não tratados especificamente
    console.log(`Evento não processado especificamente: ${event.type}`);
    return new Response(
      JSON.stringify({ received: true, eventType: event.type }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
