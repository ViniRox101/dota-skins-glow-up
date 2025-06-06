import { processCheckout, CartItem } from './stripeService';

import { getCurrentUser } from '@/integrations/supabase/client';

// ⚠️ CRÍTICO: SERVIÇO DE PAGAMENTOS - NÃO REMOVER OU ALTERAR
// Este serviço é responsável por toda a integração com o Stripe
// Qualquer alteração aqui pode quebrar o sistema de pagamentos
export const paymentService = {
  // ⚠️ CRÍTICO: Esta função é chamada pelo botão 'Finalizar Compra'
  createPaymentPreference: async (items: any[]) => {
    try {
      console.log('🚀 Iniciando checkout do Stripe com itens:', { items });
      
      // Obter dados do usuário logado
      const user = await getCurrentUser();
      const userEmail = user?.email;
      const userId = user?.id;
      
      console.log('👤 Dados do usuário:', { userEmail, userId });
      
      // Mapear os itens para o formato esperado pelo Stripe
      const stripeItems: CartItem[] = items.map(item => {
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
      
      console.log('📦 Itens mapeados para o Stripe:', stripeItems);
      
      // Processar checkout do Stripe (isso redirecionará automaticamente)
      await processCheckout(stripeItems, userEmail, userId);
      
      // Se chegou até aqui, o redirecionamento foi bem-sucedido
      return {
        success: true,
        message: 'Redirecionando para o Stripe...'
      };
    } catch (error) {
      console.error('❌ Erro no checkout do Stripe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no checkout';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};