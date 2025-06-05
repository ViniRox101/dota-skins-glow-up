import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://esjztlesvoqaquviasxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzanp0bGVzdm9xYXF1dmlhc3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTUyNTcsImV4cCI6MjA2NDA3MTI1N30.BZJh5goyZNvtCT9dCzm66sMjkzkm2dCsK6AZnlqC8R4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStockDecrement() {
  try {
    console.log('🔍 Testando função de decremento de estoque...');
    
    // 1. Primeiro, vamos listar alguns produtos para ver o que temos
    console.log('\n📦 Buscando produtos disponíveis...');
    const { data: products, error: productsError } = await supabase
      .from('items')
      .select('id, nome, estoque')
      .limit(5);
    
    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError);
      return;
    }
    
    if (!products || products.length === 0) {
      console.log('⚠️ Nenhum produto encontrado na tabela items');
      return;
    }
    
    console.log('✅ Produtos encontrados:');
    products.forEach(product => {
      console.log(`   - ${product.nome} (ID: ${product.id}, Estoque: ${product.estoque})`);
    });
    
    // 2. Vamos testar a função RPC com o primeiro produto que tem estoque > 0
    const productWithStock = products.find(p => p.estoque > 0);
    
    if (!productWithStock) {
      console.log('⚠️ Nenhum produto com estoque disponível para teste');
      return;
    }
    
    console.log(`\n🧪 Testando decremento com produto: ${productWithStock.nome}`);
    console.log(`   Estoque atual: ${productWithStock.estoque}`);
    console.log(`   Tentando decrementar: 1 unidade`);
    
    // 3. Chamar a função RPC
    const { data: newStock, error: rpcError } = await supabase.rpc('decrement_stock_by_id', {
      p_product_id: productWithStock.id,
      quantity_to_decrement: 1
    });
    
    if (rpcError) {
      console.error('❌ Erro na função RPC:', rpcError);
      return;
    }
    
    console.log(`✅ Função RPC executada com sucesso!`);
    console.log(`   Novo estoque: ${newStock}`);
    
    // 4. Verificar se o estoque foi realmente atualizado
    const { data: updatedProduct, error: checkError } = await supabase
      .from('items')
      .select('estoque')
      .eq('id', productWithStock.id)
      .single();
    
    if (checkError) {
      console.error('❌ Erro ao verificar estoque atualizado:', checkError);
      return;
    }
    
    console.log(`✅ Verificação: Estoque atual no banco: ${updatedProduct.estoque}`);
    
    if (updatedProduct.estoque === productWithStock.estoque - 1) {
      console.log('🎉 SUCESSO! O decremento de estoque está funcionando corretamente!');
    } else {
      console.log('❌ PROBLEMA! O estoque não foi decrementado corretamente.');
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar o teste
testStockDecrement();