import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno';

// Inicializar cliente Supabase com variáveis de ambiente
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Configuração CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Lidar com requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar se é um evento do Stripe
    const body = await req.json();
    console.log('Webhook recebido:', JSON.stringify(body.type));

    // Verificar se é um evento de checkout.session.completed
    if (body.type === 'checkout.session.completed') {
      const session = body.data.object;
      console.log('Sessão de checkout completada:', session.id);

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
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      console.log(`Encontrados ${lineItems.data.length} itens na sessão`);

      // Processar itens do pedido
      const orderItems = [];
      let orderTotal = 0;

      for (const item of lineItems.data) {
        try {
          const productName = item.description || '';
          console.log(`Processando item: ${productName}`);

          // Buscar produto no Supabase usando busca parcial
          const { data: products, error: productError } = await supabase
            .from('items')
            .select('*')
            .ilike('nome', `%${productName}%`)
            .limit(1);

          if (productError) {
            console.error(`Erro ao buscar produto "${productName}":`, productError);
            continue;
          }

          console.log(`Resultado da busca para "${productName}":`, products);

          // Se encontrou o produto, adicionar ao pedido
          if (products && products.length > 0) {
            const product = products[0];
            const itemPrice = item.amount_total / 100; // Converter de centavos para reais
            orderTotal += itemPrice;

            orderItems.push({
              product_id: product.id,
              product_name: product.nome,
              price: itemPrice,
              quantity: item.quantity,
              image: product.imagens && product.imagens.length > 0 ? product.imagens[0] : null,
            });

            // Decrementar estoque se necessário
            if (product.estoque !== null && product.estoque !== undefined) {
              try {
                // CORREÇÃO: Passar product_name em vez de product_id para a função RPC
                const { data: stockResult, error: stockError } = await supabase.rpc(
                  'decrement_stock',
                  { product_name: product.nome, quantity: item.quantity }
                );

                if (stockError) {
                  console.error(`Erro ao atualizar estoque para ${product.nome}:`, stockError);
                } else {
                  console.log(`Estoque atualizado para ${product.nome}:`, stockResult);
                }
              } catch (stockUpdateError) {
                console.error(`Exceção ao atualizar estoque para ${product.nome}:`, stockUpdateError);
              }
            }
          } else {
            console.warn(`Produto não encontrado: "${productName}". Adicionando com informações básicas.`);
            // Adicionar item mesmo sem encontrar o produto no banco
            const itemPrice = item.amount_total / 100;
            orderTotal += itemPrice;

            orderItems.push({
              product_id: null,
              product_name: productName,
              price: itemPrice,
              quantity: item.quantity,
              image: null,
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
          image: null,
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

      console.log('Pedido inserido com sucesso:', order);

      return new Response(
        JSON.stringify({ success: true, order }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Responder a outros eventos
    return new Response(
      JSON.stringify({ received: true }),
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