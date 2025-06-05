import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://esjztlesvoqaquviasxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzanp0bGVzdm9xYXF1dmlhc3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTUyNTcsImV4cCI6MjA2NDA3MTI1N30.BZJh5goyZNvtCT9dCzm66sMjkzkm2dCsK6AZnlqC8R4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular a função handleStockDecrement da página de sucesso
const handleStockDecrement = async (orderId, items) => {
  const STOCK_DECREMENTED_KEY_PREFIX = 'stock_decremented_';
  const stockDecrementedKey = `${STOCK_DECREMENTED_KEY_PREFIX}${orderId}`;
  
  // Simular localStorage (não funciona no Node, mas vamos pular essa verificação)
  console.log(`🔍 Verificando se estoque já foi decrementado para pedido: ${orderId}`);
  console.log(`   Chave localStorage: ${stockDecrementedKey}`);
  
  console.log(`\n📦 Iniciando decremento de estoque para o pedido ${orderId}...`);
  console.log(`   Itens a processar:`, items);
  
  let allDecremented = true;

  for (const item of items) {
    console.log(`\n🔄 Processando item: ${item.name}`);
    console.log(`   - product_id_supabase: ${item.product_id_supabase}`);
    console.log(`   - quantity: ${item.quantity}`);
    
    if (item.product_id_supabase && item.quantity > 0) {
      console.log(`   ✅ Item válido para decremento`);
      console.log(`   🔧 Chamando RPC: decrement_stock_by_id`);
      console.log(`      - p_product_id: ${item.product_id_supabase}`);
      console.log(`      - quantity_to_decrement: ${item.quantity}`);
      
      const { data, error: decrementError } = await supabase.rpc('decrement_stock_by_id', {
        p_product_id: item.product_id_supabase,
        quantity_to_decrement: item.quantity,
      });

      if (decrementError) {
        console.error(`   ❌ Erro ao decrementar estoque para product_id ${item.product_id_supabase}:`, decrementError);
        allDecremented = false;
      } else {
        console.log(`   ✅ Estoque decrementado com sucesso para product_id ${item.product_id_supabase}`);
        console.log(`      Novo estoque: ${data}`);
      }
    } else {
      console.log(`   ⚠️ Item inválido para decremento:`);
      if (!item.product_id_supabase) {
        console.log(`      - product_id_supabase está ausente ou nulo`);
      }
      if (!(item.quantity > 0)) {
        console.log(`      - quantity é inválida: ${item.quantity}`);
      }
    }
  }
  
  if (allDecremented) {
    console.log(`\n🎉 Todos os itens do pedido ${orderId} tiveram o estoque decrementado com sucesso!`);
  } else {
    console.log(`\n⚠️ Decremento de estoque não foi completo para o pedido ${orderId}.`);
  }
};

async function debugSuccessPageFlow() {
  try {
    console.log('🚀 Simulando fluxo da página de sucesso...');
    
    // Simular dados que viriam de uma sessão real de pagamento
    const mockOrderDetails = {
      id: 'TEST_ORDER_123',
      date: new Date().toLocaleDateString('pt-BR'),
      items: [
        {
          name: 'Punho Fundido',
          price: 'R$ 50,00',
          quantity: 1,
          product_id_supabase: 'b2241e43-9d84-4327-bf29-56fda661a9aa', // ID real de um produto
          image_url: '/placeholder.svg'
        },
        {
          name: 'Produto Sem ID',
          price: 'R$ 30,00',
          quantity: 2,
          product_id_supabase: null, // Simular item sem product_id_supabase
          image_url: '/placeholder.svg'
        }
      ],
      total: 'R$ 130,00',
      customer_email: 'teste@exemplo.com',
      session_status: 'paid'
    };
    
    console.log('\n📋 Dados do pedido simulado:');
    console.log(JSON.stringify(mockOrderDetails, null, 2));
    
    // Verificar se o pagamento está confirmado (como na página real)
    if (mockOrderDetails.session_status === 'paid' && mockOrderDetails.id && mockOrderDetails.items) {
      console.log('\n✅ Pagamento confirmado, iniciando decremento de estoque...');
      await handleStockDecrement(mockOrderDetails.id, mockOrderDetails.items);
    } else {
      console.log('\n❌ Condições não atendidas para decremento:');
      console.log(`   - session_status: ${mockOrderDetails.session_status}`);
      console.log(`   - id: ${mockOrderDetails.id}`);
      console.log(`   - items: ${mockOrderDetails.items ? 'presente' : 'ausente'}`);
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar o debug
debugSuccessPageFlow();