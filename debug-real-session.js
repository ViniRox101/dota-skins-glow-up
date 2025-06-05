import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://esjztlesvoqaquviasxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzanp0bGVzdm9xYXF1dmlhc3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTUyNTcsImV4cCI6MjA2NDA3MTI1N30.BZJh5goyZNvtCT9dCzm66sMjkzkm2dCsK6AZnlqC8R4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Session ID real da compra do usuário
const realSessionId = 'cs_test_a15xtg00FGJWirMgecpkLFhVQgKtBQxDeQYcl85u7GjJPqmdCvIMcYcR';

async function debugRealSession() {
  console.log('🔍 Debugando sessão real:', realSessionId);
  
  try {
    // 1. Testar a Edge Function get-session-details
    console.log('\n📡 Testando Edge Function get-session-details...');
    const response = await fetch(`https://esjztlesvoqaquviasxl.supabase.co/functions/v1/get-session-details?session_id=${realSessionId}`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na Edge Function:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Resposta da Edge Function:', JSON.stringify(data, null, 2));
    
    // 2. Verificar se temos product_id_supabase nos metadados
    if (data.lineItems && data.lineItems.length > 0) {
      console.log('\n🔍 Analisando line items:');
      data.lineItems.forEach((item, index) => {
        console.log(`\nItem ${index + 1}:`);
        console.log('  - Nome:', item.description);
        console.log('  - Quantidade:', item.quantity);
        console.log('  - Metadados do preço:', item.price?.metadata);
        console.log('  - product_id_supabase:', item.price?.metadata?.product_id_supabase);
      });
    }
    
    // 3. Verificar status do pagamento
    console.log('\n💳 Status do pagamento:', data.session?.payment_status);
    
    // 4. Simular a função handleStockDecrement
    if (data.session?.payment_status === 'paid' && data.lineItems) {
      console.log('\n🚀 Simulando handleStockDecrement...');
      
      const formattedItems = data.lineItems.map(item => ({
        name: item.description,
        price: `R$ ${((item.amount_total || 0) / 100).toFixed(2)}`,
        quantity: item.quantity || 1,
        product_id_supabase: item.price?.metadata?.product_id_supabase || null
      }));
      
      console.log('Items formatados:', formattedItems);
      
      // Simular a lógica de decremento
      for (const item of formattedItems) {
        console.log(`\n🔄 Processando: ${item.name}`);
        
        if (item.product_id_supabase) {
          console.log(`✅ Tem product_id_supabase: ${item.product_id_supabase}`);
          
          // Testar decremento
          console.log(`🔧 Decrementando ${item.quantity} unidades...`);
          const { data: newStock, error } = await supabase.rpc('decrement_stock_by_id', {
            p_product_id: item.product_id_supabase,
            quantity_to_decrement: item.quantity
          });
          
          if (error) {
            console.error('❌ Erro no decremento:', error);
          } else {
            console.log(`✅ Decremento realizado! Novo estoque: ${newStock}`);
          }
        } else {
          console.log('⚠️ Sem product_id_supabase, tentando buscar pelo nome...');
          
          const { data: product, error } = await supabase
            .from('items')
            .select('id')
            .eq('nome', item.name)
            .maybeSingle();
          
          if (error) {
            console.error('❌ Erro ao buscar produto:', error);
          } else if (product) {
            console.log(`✅ Produto encontrado: ${product.id}`);
            
            // Testar decremento
            console.log(`🔧 Decrementando ${item.quantity} unidades...`);
            const { data: newStock, error: decrementError } = await supabase.rpc('decrement_stock_by_id', {
              p_product_id: product.id,
              quantity_to_decrement: item.quantity
            });
            
            if (decrementError) {
              console.error('❌ Erro no decremento:', decrementError);
            } else {
              console.log(`✅ Decremento realizado! Novo estoque: ${newStock}`);
            }
          } else {
            console.log('❌ Produto não encontrado pelo nome');
          }
        }
      }
    } else {
      console.log('⚠️ Condições para decremento não atendidas:');
      console.log('  - Status de pagamento:', data.session?.payment_status);
      console.log('  - Tem line items:', !!data.lineItems);
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar o debug
debugRealSession();