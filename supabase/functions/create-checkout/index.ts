
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Iniciando create-checkout");
    
    const { items, success_url, cancel_url } = await req.json();
    
    console.log("Itens recebidos:", items);
    console.log("URLs:", { success_url, cancel_url });

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Nenhum item fornecido para o checkout");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Preparar os line items para o Stripe
    const lineItems = items.map((item: any) => {
      const priceInCents = Math.round(item.price * 100); // Converter para centavos
      
      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            metadata: {
              product_id: item.product_id,
            },
          },
          unit_amount: priceInCents,
        },
        quantity: item.quantity,
      };
    });

    console.log("Line items preparados:", JSON.stringify(lineItems, null, 2));

    // Criar a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
      metadata: {
        // Armazenar informações dos produtos para o webhook
        product_ids: JSON.stringify(items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))),
      },
      payment_intent_data: {
        metadata: {
          product_ids: JSON.stringify(items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))),
        },
      },
    });

    console.log("Sessão criada com ID:", session.id);
    console.log("URL de checkout:", session.url);

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro no create-checkout:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
