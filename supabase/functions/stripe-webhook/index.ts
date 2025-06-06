// ⚠️ CRÍTICO: EDGE FUNCTION DE WEBHOOK - NÃO REMOVER OU ALTERAR
// Esta função processa webhooks do Stripe e atualiza pedidos no banco
// É essencial para confirmar pagamentos e atualizar status dos pedidos
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req: Request) => {
  console.log("=== STRIPE WEBHOOK CALLED ===");
  console.log("🚀 Webhook endpoint called - Method:", req.method, "URL:", req.url);
  console.log("⏰ Timestamp:", new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ CORS preflight request handled");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("📥 Processing webhook request...");
    const body = await req.text();
    console.log("📄 Request body length:", body.length);
    
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    console.log("🔑 Signature present:", !!signature);
    console.log("🔐 Webhook secret present:", !!webhookSecret);

    if (!signature || !webhookSecret) {
      console.error("❌ Missing signature or webhook secret");
      return new Response("Missing signature or webhook secret", { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("✅ Webhook signature verified");
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    console.log("📨 Received webhook event:", event.type);

    // Processa apenas eventos de checkout completado
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("🛒 Processing completed checkout session:", session.id);

      try {
        console.log("🔍 Session details:", JSON.stringify({
          id: session.id,
          amount_total: session.amount_total,
          customer_details: session.customer_details,
          client_reference_id: session.client_reference_id,
          payment_status: session.payment_status,
          status: session.status
        }, null, 2));

        // Recupera os line items da sessão
        console.log("📦 Fetching line items for session:", session.id);
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product']
        });
        console.log("✅ Line items fetched successfully, count:", lineItems.data.length);

        // Verifica se temos um email válido
        const customerEmail = session.customer_details?.email;
        if (!customerEmail) {
          console.error("❌ No customer email found in session");
          return new Response(
            JSON.stringify({ error: "No customer email found" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prepara os dados do pedido
        const orderData = {
          session_id: session.id,
          email: customerEmail,
          total: session.amount_total ? session.amount_total / 100 : 0, // Converte de centavos para reais
          status: 'completed',
          items: lineItems.data.map(item => ({
            name: (item.price?.product as Stripe.Product)?.name || 'Produto',
            quantity: item.quantity || 1,
            price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
            price_id: item.price?.id,
            product_id: (item.price?.product as Stripe.Product)?.id
          })),
          user_id: session.client_reference_id || null
        };

        console.log("📋 Order data prepared:", JSON.stringify(orderData, null, 2));
        console.log("🔍 Line items details:", JSON.stringify(lineItems.data, null, 2));

        console.log("💾 Saving order to database:", {
          session_id: orderData.session_id,
          email: orderData.email,
          total: orderData.total,
          items_count: orderData.items.length
        });

        // Salva o pedido no Supabase
        console.log("💾 Attempting to insert order into database...");
        console.log("🔧 Supabase client configured with URL:", Deno.env.get("SUPABASE_URL"));
        console.log("🔑 Service role key present:", !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
        
        const { data, error } = await supabase
          .from('orders')
          .insert([orderData])
          .select();

        if (error) {
          console.error("❌ Error saving order to database:", JSON.stringify(error, null, 2));
          console.error("❌ Error details - code:", error.code);
          console.error("❌ Error details - message:", error.message);
          console.error("❌ Error details - details:", error.details);
          console.error("❌ Error details - hint:", error.hint);
          throw error;
        }

        console.log("✅ Order saved successfully:", JSON.stringify(data, null, 2));

        return new Response(
          JSON.stringify({ 
            received: true, 
            order_id: data[0]?.id,
            session_id: session.id 
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );

      } catch (dbError) {
        console.error("❌ Database error:", dbError);
        return new Response(
          JSON.stringify({ 
            error: "Database error", 
            details: dbError.message 
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    } else {
      console.log("ℹ️ Ignoring webhook event type:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});