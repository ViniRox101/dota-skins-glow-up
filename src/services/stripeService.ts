import { loadStripe, Stripe } from '@stripe/stripe-js';

// Carrega a instância do Stripe com a chave pública
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      throw new Error('Chave pública do Stripe não encontrada. Verifique se VITE_STRIPE_PUBLISHABLE_KEY está configurada no arquivo .env');
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Interface para os itens do carrinho
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Interface para a resposta da criação da sessão de checkout
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

// ⚠️ CRÍTICO: FUNÇÃO DE CRIAÇÃO DE SESSÃO - NÃO REMOVER OU ALTERAR
// Esta função cria a sessão de checkout no Stripe via Edge Function
// É chamada pela função processCheckout e é essencial para o pagamento
export const createCheckoutSession = async (items: CartItem[], userEmail?: string, userId?: string): Promise<CheckoutSessionResponse> => {
  try {
    console.log('Criando sessão de checkout com itens:', items);
    console.log('Email do usuário:', userEmail);
    console.log('ID do usuário:', userId);
    
    // URL da Edge Function do Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        items: items.map(item => ({
          price_data: {
            currency: 'brl',
            product_data: {
              name: item.name,
              images: item.image ? [item.image] : [],
            },
            unit_amount: Math.round(item.price * 100), // Converte para centavos
          },
          quantity: item.quantity,
        })),
        customer_email: userEmail,
        client_reference_id: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erro ao criar sessão de checkout: ${response.statusText} - ${errorData.error || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw error;
  }
};

// ⚠️ CRÍTICO: FUNÇÃO DE REDIRECIONAMENTO - NÃO REMOVER OU ALTERAR
// Esta função redireciona o usuário para a página de pagamento do Stripe
// É chamada após a criação da sessão e é essencial para completar o checkout
export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  try {
    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Falha ao carregar o Stripe');
    }

    console.log('Redirecionando para checkout com sessionId:', sessionId);
    
    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      console.error('Erro ao redirecionar para checkout:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro no redirecionamento:', error);
    throw error;
  }
};

// ⚠️ CRÍTICO: FUNÇÃO PRINCIPAL DO CHECKOUT - NÃO REMOVER OU ALTERAR
// Esta função é chamada pelo paymentService e é essencial para o funcionamento do Stripe
// Qualquer alteração aqui pode quebrar todo o fluxo de pagamento
export const processCheckout = async (items: CartItem[], userEmail?: string, userId?: string): Promise<void> => {
  try {
    // ⚠️ CRÍTICO: Cria a sessão de checkout no Stripe
    const { sessionId } = await createCheckoutSession(items, userEmail, userId);
    
    // ⚠️ CRÍTICO: Redireciona para o checkout do Stripe
    await redirectToCheckout(sessionId);
  } catch (error) {
    console.error('Erro no processo de checkout:', error);
    throw error;
  }
};

export default getStripe;