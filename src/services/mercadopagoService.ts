// Serviço para integração com Mercado Pago
// Substitui a funcionalidade do Stripe para pagamentos

// Interface para os itens do carrinho (compatível com o Stripe)
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Interface para a resposta da criação da preferência de pagamento
export interface PaymentPreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
  externalReference: string;
  // Para compatibilidade com o frontend existente
  sessionId: string;
  url: string;
}

// Função para criar preferência de pagamento no Mercado Pago
export const createPaymentPreference = async (
  items: CartItem[], 
  userEmail?: string, 
  userId?: string
): Promise<PaymentPreferenceResponse> => {
  try {
    console.log('🚀 Creating Mercado Pago payment preference with items:', items);
    console.log('📧 User email:', userEmail);
    console.log('🆔 User ID:', userId);
    
    // URL da Edge Function do Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/create-payment-preference`;
    
    console.log('🌐 Function URL:', functionUrl);
    
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
              description: `Produto: ${item.name}`,
              images: item.image ? [item.image] : [],
            },
            unit_amount: Math.round(item.price * 100), // Converte para centavos (compatibilidade)
          },
          quantity: item.quantity,
        })),
        customer_email: userEmail,
        client_reference_id: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error response:', errorData);
      throw new Error(`Erro ao criar preferência de pagamento: ${response.statusText} - ${errorData.error || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    console.log('✅ Payment preference created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating payment preference:', error);
    throw error;
  }
};

// Função para redirecionar para o checkout do Mercado Pago
export const redirectToMercadoPago = (initPoint: string): void => {
  try {
    console.log('🔄 Redirecting to Mercado Pago checkout:', initPoint);
    
    // Redirecionar para a URL do Mercado Pago
    window.location.href = initPoint;
  } catch (error) {
    console.error('❌ Error redirecting to Mercado Pago:', error);
    throw error;
  }
};

// Função principal do checkout do Mercado Pago
export const processMercadoPagoCheckout = async (
  items: CartItem[], 
  userEmail?: string, 
  userId?: string
): Promise<void> => {
  try {
    console.log('🚀 Processing Mercado Pago checkout...');
    
    // Criar a preferência de pagamento
    const { initPoint } = await createPaymentPreference(items, userEmail, userId);
    
    // Redirecionar para o checkout do Mercado Pago
    redirectToMercadoPago(initPoint);
  } catch (error) {
    console.error('❌ Error in Mercado Pago checkout process:', error);
    throw error;
  }
};

// Função para verificar se o Mercado Pago está configurado
export const isMercadoPagoConfigured = (): boolean => {
  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  return !!publicKey;
};

// Função para obter a chave pública do Mercado Pago
export const getMercadoPagoPublicKey = (): string => {
  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  
  if (!publicKey) {
    throw new Error('Chave pública do Mercado Pago não encontrada. Verifique se VITE_MERCADOPAGO_PUBLIC_KEY está configurada no arquivo .env');
  }
  
  return publicKey;
};

export default {
  createPaymentPreference,
  redirectToMercadoPago,
  processMercadoPagoCheckout,
  isMercadoPagoConfigured,
  getMercadoPagoPublicKey
};