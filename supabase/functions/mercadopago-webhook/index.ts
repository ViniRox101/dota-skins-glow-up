// Função para processar webhooks do Mercado Pago
// Processa notificações de pagamento e atualiza pedidos no banco
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Função para verificar assinatura do webhook do Mercado Pago
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    // Implementação da verificação de assinatura do Mercado Pago
    // O Mercado Pago usa HMAC-SHA256
    const crypto = globalThis.crypto;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(body);
    
    // Para verificação completa, seria necessário usar a biblioteca crypto
    // Por enquanto, vamos aceitar se a assinatura existe
    return signature && signature.length > 0;
  } catch (error) {
    console.error("❌ Error verifying webhook signature:", error);
    return false;
  }
}

serve(async (req: Request) => {
  console.log("=== MERCADO PAGO WEBHOOK CALLED ===");
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
    console.log("📄 Request body:", body);
    
    // Verificar assinatura do webhook (se configurada)
    const signature = req.headers.get("x-signature") || req.headers.get("x-request-id");
    const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
    
    console.log("🔑 Signature present:", !!signature);
    console.log("🔐 Webhook secret present:", !!webhookSecret);

    // ⚠️ TEMPORARIAMENTE DESABILITADO PARA TESTES - REATIVAR EM PRODUÇÃO!
    // TODO: Reativar verificação de assinatura antes do deploy em produção
    // Se temos secret configurado, verificar assinatura
    /*
    if (webhookSecret && signature) {
      const isValidSignature = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValidSignature) {
        console.error("❌ Invalid webhook signature");
        return new Response("Invalid signature", { status: 401 });
      }
      console.log("✅ Webhook signature verified");
    }
    */
    console.log("⚠️ ATENÇÃO: Verificação de assinatura DESABILITADA para testes!");

    let webhookData;
    try {
      webhookData = JSON.parse(body);
      console.log("✅ Webhook data parsed successfully");
    } catch (err) {
      console.error("❌ Failed to parse webhook data:", err);
      return new Response("Invalid JSON", { status: 400 });
    }

    console.log("📨 Received webhook data:", JSON.stringify(webhookData, null, 2));

    // Processar diferentes tipos de notificação do Mercado Pago
    const { type, action, data } = webhookData;
    
    console.log("📋 Webhook type:", type, "Action:", action);

    // Processar notificações de pagamento
    if (type === "payment" && action === "payment.updated") {
      const paymentId = data?.id;
      
      if (!paymentId) {
        console.error("❌ No payment ID found in webhook data");
        return new Response("No payment ID", { status: 400 });
      }

      console.log("💳 Processing payment update for ID:", paymentId);

      try {
        // Buscar informações do pagamento usando a API do Mercado Pago
        const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
        
        if (!accessToken) {
          console.error("❌ Mercado Pago access token not configured");
          return new Response("Access token not configured", { status: 500 });
        }

        console.log("🔍 Fetching payment details from Mercado Pago API...");
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!paymentResponse.ok) {
          console.error("❌ Failed to fetch payment from Mercado Pago:", paymentResponse.status);
          return new Response("Failed to fetch payment", { status: 500 });
        }

        const paymentData = await paymentResponse.json();
        console.log("✅ Payment data fetched:", JSON.stringify(paymentData, null, 2));

        // Extrair informações relevantes do pagamento
        const {
          id: payment_id,
          status,
          status_detail,
          transaction_amount,
          payer,
          external_reference,
          preference_id
        } = paymentData;

        console.log("📋 Payment details:", {
          payment_id,
          status,
          status_detail,
          transaction_amount,
          payer_email: payer?.email,
          external_reference,
          preference_id
        });

        // Processar apenas pagamentos aprovados
        if (status === "approved") {
          console.log("✅ Payment approved, updating order...");

          // Buscar o pedido pelo external_reference ou preference_id
          const orderReference = external_reference || preference_id;
          
          if (!orderReference) {
            console.error("❌ No order reference found in payment");
            return new Response("No order reference", { status: 400 });
          }

          // Atualizar o pedido no banco de dados
          console.log("💾 Updating order in database with reference:", orderReference);
          
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .update({
              status: 'completed',
              payment_id: payment_id,
              payment_status: status,
              payment_method: paymentData.payment_method_id,
              updated_at: new Date().toISOString()
            })
            .eq('session_id', orderReference)
            .select();

          if (orderError) {
            console.error("❌ Error updating order:", JSON.stringify(orderError, null, 2));
            throw orderError;
          }

          if (!orderData || orderData.length === 0) {
            console.log("⚠️ No order found with reference:", orderReference);
            // Não é necessariamente um erro, pode ser um pagamento de teste
            return new Response(
              JSON.stringify({ 
                received: true, 
                message: "No order found",
                payment_id 
              }),
              {
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }

          console.log("✅ Order updated successfully:", JSON.stringify(orderData, null, 2));

          return new Response(
            JSON.stringify({ 
              received: true, 
              order_id: orderData[0]?.id,
              payment_id,
              status: "completed"
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );

        } else {
          console.log("ℹ️ Payment not approved, status:", status, "detail:", status_detail);
          
          // Para outros status, apenas registrar
          return new Response(
            JSON.stringify({ 
              received: true, 
              payment_id,
              status,
              message: "Payment status noted"
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

      } catch (apiError) {
        console.error("❌ API error:", apiError);
        return new Response(
          JSON.stringify({ 
            error: "API error", 
            details: apiError.message 
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
      console.log("ℹ️ Ignoring webhook type:", type, "action:", action);
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