// Edge Function para criar preferência de pagamento no Mercado Pago
// Substitui a funcionalidade do Stripe checkout session
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req: Request) => {
  console.log("=== MERCADO PAGO CREATE PREFERENCE CALLED ===");
  console.log("🚀 Function called - Method:", req.method, "URL:", req.url);
  console.log("⏰ Timestamp:", new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ CORS preflight request handled");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("📥 Processing payment preference request...");
    const requestBody = await req.json();
    console.log("📄 Request body:", JSON.stringify(requestBody, null, 2));
    
    const { items, customer_email, client_reference_id } = requestBody;
    
    console.log('📧 Customer email:', customer_email);
    console.log('🆔 Client reference ID:', client_reference_id);
    console.log('📦 Items:', items);

    // Validar se os itens foram fornecidos
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("❌ Validation failed - invalid items:", { items, isArray: Array.isArray(items), length: items?.length });
      throw new Error("Cart items are required");
    }

    // Validar cada item individualmente
    items.forEach((item, index) => {
      console.log(`Item ${index}:`, JSON.stringify(item, null, 2));
      if (!item.price_data || !item.quantity) {
        console.error(`❌ Item ${index} invalid:`, item);
        throw new Error(`Item ${index} is malformed - Each item must have price_data and quantity`);
      }
      if (!item.price_data.unit_amount || !item.price_data.product_data) {
        console.error(`❌ Item ${index} price_data invalid:`, item.price_data);
        throw new Error(`Item ${index} price_data is malformed - Must have unit_amount and product_data`);
      }
    });

    // Obter configurações do Mercado Pago
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    
    if (!accessToken) {
      console.error("❌ Mercado Pago access token not configured");
      throw new Error("Mercado Pago access token not configured");
    }

    // Obter a origem da requisição para URLs de retorno
    const origin = req.headers.get("origin") || "http://localhost:8081";
    console.log('🌐 Request origin:', origin);

    // Converter itens do formato Stripe para Mercado Pago
    const mercadoPagoItems = items.map((item, index) => {
      const { price_data, quantity } = item;
      const unitPrice = price_data.unit_amount / 100; // Converter de centavos para reais
      
      return {
        id: `item_${index}`,
        title: price_data.product_data?.name || `Product ${index + 1}`,
        description: price_data.product_data?.description || '',
        quantity: quantity,
        unit_price: unitPrice,
        currency_id: "BRL"
      };
    });

    console.log('🛒 Mercado Pago items:', JSON.stringify(mercadoPagoItems, null, 2));

    // Calcular total
    const totalAmount = mercadoPagoItems.reduce((sum, item) => {
      return sum + (item.unit_price * item.quantity);
    }, 0);

    console.log('💰 Total amount:', totalAmount);

    // Criar dados da preferência
    const preferenceData = {
      items: mercadoPagoItems,
      payer: {
        email: customer_email || "test@test.com"
      },
      back_urls: {
        success: `${origin}/success`,
        failure: `${origin}/cancel`,
        pending: `${origin}/cancel`
      },
      auto_return: "approved",
      external_reference: client_reference_id || `order_${Date.now()}`,
      notification_url: `${origin.replace('localhost:8081', 'esjztlesvoqaquviasxl.supabase.co')}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "Dota Skins Store",
      metadata: {
        source: "dota-skins-store",
        customer_email: customer_email,
        client_reference_id: client_reference_id
      }
    };

    console.log('📋 Preference data:', JSON.stringify(preferenceData, null, 2));

    // Fazer requisição para a API do Mercado Pago
    console.log('🌐 Creating preference in Mercado Pago...');
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Mercado Pago API error:', response.status, errorText);
      throw new Error(`Mercado Pago API error: ${response.status} - ${errorText}`);
    }

    const preferenceResponse = await response.json();
    console.log('✅ Preference created successfully:', JSON.stringify(preferenceResponse, null, 2));

    // Retornar dados da preferência
    return new Response(
      JSON.stringify({
        preferenceId: preferenceResponse.id,
        initPoint: preferenceResponse.init_point,
        sandboxInitPoint: preferenceResponse.sandbox_init_point,
        externalReference: preferenceResponse.external_reference,
        // Para compatibilidade com o frontend existente
        sessionId: preferenceResponse.id,
        url: preferenceResponse.init_point
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("❌ Error creating payment preference:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.stack
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});