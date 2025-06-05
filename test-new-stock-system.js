import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://esjztlesvoqaquviasxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzanp0bGVzdm9xYXF1dmlhc3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTUyNTcsImV4cCI6MjA2NDA3MTI1N30.BZJh5goyZNvtCT9dCzm66sMjkzkm2dCsK6AZnlqC8R4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular a nova função de busca por nome
async function findProductIdByName(productName) {
  try {
    console.log(`🔍 Buscando product_id_supabase para: ${productName}`);
    
    const { data: product, error } = await supabase
      .from('items')
      .select('id')
      .eq('nome', productName)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao buscar produto por nome:', error);
      return null;
    }
    
    if (product) {
      console.log(`✅ Produto encontrado: ${productName} -> ${product.id}`);
      return product.id;
    }
    
    console.warn(`⚠️ Produto não encontrado: ${productName}`);
    return null;
  } catch (error) {
    console.error('Erro inesperado ao buscar produto:', error);
    return null;
  }
}

// Simular a nova função de decremento
async function decrementProductStock(productId, quantity, productName) {
  try {
    console.log(`🔧 Decrementando ${quantity} unidades do produto ${productName} (ID: ${productId})`);
    
    const { data: newStock, error: decrementError } = await supabase.rpc('decrement_stock_by_id', {
      p_product_id: productId,
      quantity_to_decrement: quantity,
    });

    if (decrementError) {
      console.error(`❌ Erro ao decrementar estoque para ${productName}:`, decrementError);
      return false;
    }

    console.log(`✅ Estoque decrementado com sucesso para ${productName}. Novo estoque: ${newStock}`);
    return true;
  } catch (error) {
    console.error(`💥 Erro inesperado ao decrementar estoque para ${productName}:`, error);
    return false;
  }
}

// Simular a nova função principal
async function handleStockDecrement(orderId, items) {
  console.log(`🚀 Iniciando decremento de estoque para o pedido ${orderId}...`);
  console.log(`📦 Itens a processar:`, items);
  
  let allDecremented = true;
  let processedItems = 0;

  for (const item of items) {
    console.log(`\n🔄 Processando item: ${item.name}`);
    
    // Verificar se já temos o product_id_supabase
    let productId = item.product_id_supabase;
    
    // Se não temos o product_id_supabase, tentar buscar pelo nome
    if (!productId) {
      console.log(`⚠️ product_id_supabase não encontrado, buscando pelo nome...`);
      productId = await findProductIdByName(item.name);
    }
    
    // Verificar se temos um ID válido e quantidade válida
    if (productId && item.quantity > 0) {
      console.log(`✅ Item válido para decremento:`);
      console.log(`   - Produto: ${item.name}`);
      console.log(`   - ID: ${productId}`);
      console.log(`   - Quantidade: ${item.quantity}`);
      
      const success = await decrementProductStock(productId, item.quantity, item.name);
      
      if (success) {
        processedItems++;
      } else {
        allDecremented = false;
      }
    } else {
      console.log(`❌ Item inválido para decremento:`);
      if (!productId) {
        console.log(`   - Produto não encontrado: ${item.name}`);
      }
      if (!(item.quantity > 0)) {
        console.log(`   - Quantidade inválida: ${item.quantity}`);
      }
      allDecremented = false;
    }
  }
  
  // Resultado final
  if (allDecremented && processedItems > 0) {
    console.log(`🎉 Todos os ${processedItems} itens do pedido ${orderId} tiveram o estoque decrementado com sucesso!`);
  } else if (processedItems > 0) {
    console.warn(`⚠️ Decremento parcial: ${processedItems} de ${items.length} itens processados para o pedido ${orderId}.`);
  } else {
    console.error(`❌ Nenhum item foi processado para o pedido ${orderId}.`);
  }
}

async function testNewStockSystem() {
  try {
    console.log('🧪 Testando o novo sistema de decremento de estoque...');
    
    // Buscar produtos reais da base de dados
    const { data: products, error } = await supabase
      .from('items')
      .select('id, nome, estoque')
      .gt('estoque', 0)
      .limit(2);
    
    if (error || !products || products.length === 0) {
      console.error('❌ Erro ao buscar produtos ou nenhum produto disponível');
      return;
    }
    
    console.log('\n📦 Produtos disponíveis para teste:');
    products.forEach(p => console.log(`   - ${p.nome} (Estoque: ${p.estoque})`));
    
    // Simular dados de um pedido real
    const mockOrderDetails = {
      id: 'TEST_NEW_SYSTEM_456',
      items: [
        {
          name: products[0].nome, // Usar nome real do produto
          price: 'R$ 50,00',
          quantity: 1,
          product_id_supabase: null, // Simular que não temos o ID (vai buscar pelo nome)
        },
        {
          name: products[1]?.nome || 'Produto Inexistente', // Segundo produto ou nome inexistente
          price: 'R$ 30,00',
          quantity: 1,
          product_id_supabase: products[1]?.id || null, // Usar ID real se disponível
        },
        {
          name: 'Produto Que Não Existe',
          price: 'R$ 20,00',
          quantity: 1,
          product_id_supabase: null, // Produto que não existe
        }
      ]
    };
    
    console.log('\n📋 Simulando pedido com mix de cenários:');
    console.log('   1. Produto real sem product_id_supabase (vai buscar pelo nome)');
    console.log('   2. Produto real com product_id_supabase');
    console.log('   3. Produto inexistente');
    
    await handleStockDecrement(mockOrderDetails.id, mockOrderDetails.items);
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar o teste
testNewStockSystem();