import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

// ⚠️ CRÍTICO: EDGE FUNCTION DE CHECKOUT - NÃO REMOVER OU ALTERAR
// Esta função é responsável por criar sessões de checkout no Stripe
// É chamada pelo frontend e é essencial para o funcionamento dos pagamentos
// Importa o Stripe
import Stripe from "https://esm.sh/stripe@14.21.0";

// ⚠️ CRÍTICO: Configuração do Stripe - NÃO ALTERAR
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log("Corpo da requisição recebido:", JSON.stringify(requestBody, null, 2));
    
    const { items, customer_email, client_reference_id } = requestBody;
    
    console.log('📧 Email do cliente:', customer_email);
    console.log('🆔 ID de referência do cliente:', client_reference_id);

    console.log("Criando sessão de checkout com itens:", items);
    console.log("Tipo dos itens:", typeof items);
    console.log("É array?", Array.isArray(items));
    console.log("Quantidade de itens:", items?.length);

    // Valida se os itens foram fornecidos
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("Validação falhou - itens inválidos:", { items, isArray: Array.isArray(items), length: items?.length });
      throw new Error("Itens do carrinho são obrigatórios");
    }

    // Valida cada item individualmente
    items.forEach((item, index) => {
      console.log(`Item ${index}:`, JSON.stringify(item, null, 2));
      if (!item.price_data || !item.quantity) {
        console.error(`Item ${index} inválido:`, item);
        throw new Error(`Item ${index} está mal formatado`);
      }
    });

    // Obter a origem da requisição
    const origin = req.headers.get("origin") || "http://localhost:8081";
    console.log('🌐 Origin da requisição:', origin);
    
    // Cria a sessão de checkout no Stripe
    // Nota: PIX removido temporariamente devido a erro de configuração no Stripe
    const sessionData: any = {
      payment_method_types: ["card"],
      line_items: items,
      mode: "payment",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      locale: "pt-BR",
      currency: "brl",
      metadata: {
        source: "dota-skins-store",
      },
    };
    
    console.log('🔗 URLs configuradas:');
    console.log('  - Success URL:', sessionData.success_url);
    console.log('  - Cancel URL:', sessionData.cancel_url);
    
    // Adicionar email do cliente se fornecido
    if (customer_email) {
      sessionData.customer_email = customer_email;
    }
    
    // Adicionar referência do cliente se fornecida
    if (client_reference_id) {
      sessionData.client_reference_id = client_reference_id;
    }
    
    console.log('🛒 Dados da sessão:', sessionData);
    
    const session = await stripe.checkout.sessions.create(sessionData);

    console.log("Sessão criada com sucesso:", session.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Erro interno do servidor",
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