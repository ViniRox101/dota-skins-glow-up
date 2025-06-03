
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.1.0?target=deno&deno-std=0.168.0';
import { corsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let sessionId: string | null = null;

    if (req.method === 'GET') {
      // Para requisições GET, pegar da URL
      const url = new URL(req.url);
      sessionId = url.searchParams.get('session_id');
    } else if (req.method === 'POST') {
      // Para requisições POST, pegar do body
      const body = await req.json();
      sessionId = body.session_id;
    }

    if (!sessionId) {
      throw new Error('Session ID é obrigatório');
    }

    console.log('Buscando detalhes da sessão:', sessionId);

    // Buscar detalhes da sessão
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Sessão encontrada:', session.id);

    // Buscar itens da sessão
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      expand: ['data.price.product'],
    });
    console.log('Line items encontrados:', lineItems.data.length);

    return new Response(JSON.stringify({
      session: {
        id: session.id,
        amount_total: session.amount_total,
        created: session.created,
        customer_details: session.customer_details,
        payment_status: session.payment_status,
      },
      lineItems: lineItems.data.map(item => ({
        description: item.description,
        amount_total: item.amount_total,
        quantity: item.quantity,
      })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro ao buscar detalhes da sessão:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
