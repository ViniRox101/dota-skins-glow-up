import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno';

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
    // Obter session_id da URL
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');

    console.log('Requisição recebida para session_id:', sessionId);
    console.log('Headers recebidos:', JSON.stringify(Object.fromEntries(req.headers.entries())));

    if (!sessionId) {
      throw new Error('session_id é obrigatório');
    }

    // Inicializar Stripe com a chave secreta
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY não está configurada no ambiente');
      throw new Error('STRIPE_SECRET_KEY não está configurada');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    console.log('Buscando detalhes da sessão no Stripe...');

    // Buscar detalhes da sessão
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'customer_details'],
      });

      console.log('Sessão encontrada:', session.id);
      console.log('Status da sessão:', session.status);
      console.log('Detalhes do cliente:', session.customer_details ? 'disponíveis' : 'não disponíveis');

      // Buscar itens da linha
      console.log('Buscando itens da linha...');
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
        expand: ['data.price.product'],
      });

      console.log(`Encontrados ${lineItems.data.length} itens na sessão`);
      
      if (lineItems.data.length > 0) {
        console.log('Primeiro item:', JSON.stringify({
          description: lineItems.data[0].description,
          amount_total: lineItems.data[0].amount_total,
          quantity: lineItems.data[0].quantity
        }));
      }

      // Retornar os dados da sessão e itens
      return new Response(
        JSON.stringify({
          success: true,
          session: session,
          lineItems: lineItems.data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError) {
      console.error('Erro específico do Stripe:', stripeError.message);
      console.error('Código do erro Stripe:', stripeError.code);
      console.error('Status do erro Stripe:', stripeError.statusCode);
      
      // Repassar o erro para ser tratado no catch externo
      throw stripeError;
    }
  } catch (error) {
    console.error('Erro ao buscar detalhes da sessão:', error.message);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        message: 'Falha ao buscar detalhes da sessão',
        stack: Deno.env.get('ENVIRONMENT') === 'development' ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.statusCode || error.status || 500,
      }
    );
  }
});