
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Webhook recebido");
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      console.error("Assinatura do Stripe não encontrada");
      return new Response("Assinatura não encontrada", { status: 400 });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
    if (!webhookSecret) {
      console.error("Webhook secret não configurado");
      return new Response("Webhook secret não configurado", { status: 500 });
    }

    // Verificar a assinatura do webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("Evento verificado:", event.type);
    } catch (err) {
      console.error("Erro na verificação do webhook:", err);
      return new Response("Assinatura inválida", { status: 400 });
    }

    // Processar apenas eventos de checkout completado
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Processando checkout completado:", session.id);

      try {
        // Obter os produtos da metadata
        let productItems: Array<{product_id: string, quantity: number}> = [];
        
        if (session.metadata?.product_ids) {
          try {
            productItems = JSON.parse(session.metadata.product_ids);
            console.log("Produtos da sessão metadata:", productItems);
          } catch (parseError) {
            console.error("Erro ao parsear product_ids da sessão:", parseError);
          }
        }

        // Se não tiver na sessão, tentar obter do payment_intent
        if (productItems.length === 0 && session.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
            if (paymentIntent.metadata?.product_ids) {
              productItems = JSON.parse(paymentIntent.metadata.product_ids);
              console.log("Produtos do payment_intent metadata:", productItems);
            }
          } catch (piError) {
            console.error("Erro ao obter payment_intent:", piError);
          }
        }

        // Se ainda não tiver, tentar obter dos line_items
        if (productItems.length === 0) {
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
              expand: ['data.price.product']
            });
            
            for (const item of lineItems.data) {
              const product = item.price?.product as Stripe.Product;
              if (product?.metadata?.product_id) {
                productItems.push({
                  product_id: product.metadata.product_id,
                  quantity: item.quantity || 1
                });
              }
            }
            console.log("Produtos dos line_items:", productItems);
          } catch (liError) {
            console.error("Erro ao obter line_items:", liError);
          }
        }

        if (productItems.length === 0) {
          console.error("Nenhum produto encontrado para diminuir estoque");
          return new Response("Produtos não encontrados", { status: 400 });
        }

        // Diminuir o estoque para cada produto
        const stockResults = [];
        for (const item of productItems) {
          try {
            console.log(`Diminuindo estoque do produto ${item.product_id} em ${item.quantity} unidade(s)`);
            
            const { data, error } = await supabase.rpc('decrement_stock_by_id', {
              p_product_id: item.product_id,
              quantity_to_decrement: item.quantity
            });

            if (error) {
              console.error(`Erro ao diminuir estoque do produto ${item.product_id}:`, error);
              stockResults.push({ product_id: item.product_id, success: false, error: error.message });
            } else {
              console.log(`Estoque do produto ${item.product_id} atualizado. Novo estoque: ${data}`);
              stockResults.push({ product_id: item.product_id, success: true, new_stock: data });
            }
          } catch (stockError) {
            console.error(`Exceção ao diminuir estoque do produto ${item.product_id}:`, stockError);
            stockResults.push({ product_id: item.product_id, success: false, error: stockError.message });
          }
        }

        console.log("Resultados da atualização de estoque:", stockResults);

        // Registrar o pedido na tabela orders
        try {
          const { error: orderError } = await supabase
            .from('orders')
            .insert({
              session_id: session.id,
              email: session.customer_details?.email || 'unknown',
              total_amount: session.amount_total || 0,
              customer_details: {
                email: session.customer_details?.email,
                name: session.customer_details?.name
              },
              product_items: productItems,
              status: 'completed'
            });

          if (orderError) {
            console.error("Erro ao registrar pedido:", orderError);
          } else {
            console.log("Pedido registrado com sucesso");
          }
        } catch (orderInsertError) {
          console.error("Exceção ao registrar pedido:", orderInsertError);
        }

      } catch (processingError) {
        console.error("Erro no processamento do checkout:", processingError);
        return new Response("Erro no processamento", { status: 500 });
      }
    } else {
      console.log(`Evento ${event.type} ignorado`);
    }

    return new Response("OK", { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error("Erro geral no webhook:", error);
    return new Response("Erro interno", { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
