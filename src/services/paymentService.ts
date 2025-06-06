import { processMercadoPagoCheckout, CartItem } from './mercadopagoService';

import { getCurrentUser } from '@/integrations/supabase/client';

// Serviço de pagamentos - Migrado para Mercado Pago
// Este serviço é responsável por toda a integração com pagamentos
// Migrado do Stripe para Mercado Pago
export const paymentService = {
  // Função principal chamada pelo botão 'Finalizar Compra'
  // Migrada para usar Mercado Pago em vez de Stripe
  createPaymentPreference: async (items: any[]) => {
    try {
      console.log('🚀 Iniciando checkout do Mercado Pago com itens:', { items });
      
      // Obter dados do usuário logado
      const user = await getCurrentUser();
      const userEmail = user?.email;
      const userId = user?.id;
      
      console.log('👤 Dados do usuário:', { userEmail, userId });
      
      // Mapear os itens para o formato esperado pelo Mercado Pago
      const mercadoPagoItems: CartItem[] = items.map(item => {
        // Calcular o preço com desconto se houver desconto_porcentagem
        const precoOriginal = parseFloat(item.preco || item.price || '0');
        const descontoPorcentagem = item.desconto_porcentagem || 0;
        const precoComDesconto = descontoPorcentagem > 0 
          ? precoOriginal * (1 - descontoPorcentagem / 100)
          : precoOriginal;
        
        console.log(`💰 Item: ${item.nome}, Preço original: R$ ${precoOriginal}, Desconto: ${descontoPorcentagem}%, Preço final: R$ ${precoComDesconto.toFixed(2)}`);
        
        return {
          id: item.id || String(Math.random()),
          name: item.nome || item.name || 'Produto',
          price: precoComDesconto, // Usar o preço com desconto aplicado
          quantity: parseInt(item.quantidade || item.quantity || '1'),
          image: item.imagem_url || item.imagem || item.image
        };
      });
      
      console.log('📦 Itens mapeados para o Mercado Pago:', mercadoPagoItems);
      
      // Processar checkout do Mercado Pago (isso redirecionará automaticamente)
      await processMercadoPagoCheckout(mercadoPagoItems, userEmail, userId);
      
      // Se chegou até aqui, o redirecionamento foi bem-sucedido
      return {
        success: true,
        message: 'Redirecionando para o Mercado Pago...'
      };
    } catch (error) {
      console.error('❌ Erro no checkout do Mercado Pago:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no checkout';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};