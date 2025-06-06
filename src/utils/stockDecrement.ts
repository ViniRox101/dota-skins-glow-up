import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface OrderItem {
  id?: string;
  nome?: string;
  name?: string;
  price?: string;
  preco?: number;
  quantity?: number;
  quantidade?: number;
  product_id_supabase?: string;
  image_url?: string;
  imageUrl?: string;
}

const STOCK_DECREMENTED_KEY_PREFIX = 'stock_decremented_';

/**
 * Busca o product_id_supabase usando o nome do produto
 */
async function findProductIdByName(productName: string): Promise<string | null> {
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

/**
 * Decrementa o estoque de um produto específico
 */
async function decrementProductStock(productId: string, quantity: number, productName: string): Promise<boolean> {
  try {
    console.log(`\n🔧 === INÍCIO DECREMENTPRODUCTSTOCK ===`);
    console.log(`📦 Produto: ${productName}`);
    console.log(`🆔 Product ID: ${productId}`);
    console.log(`📊 Quantidade a decrementar: ${quantity}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    const rpcParams = {
      p_product_id: productId,
      quantity_to_decrement: quantity,
    };
    
    console.log(`🚀 Chamando supabase.rpc('decrement_stock_by_id') com parâmetros:`, rpcParams);
    
    const { data: newStock, error: decrementError } = await supabase.rpc('decrement_stock_by_id', rpcParams);

    if (decrementError) {
      console.error(`❌ Erro ao decrementar estoque para ${productName}:`, decrementError);
      console.log(`🔧 === FIM DECREMENTPRODUCTSTOCK (ERRO) ===\n`);
      toast({
        title: 'Erro ao Atualizar Estoque',
        description: `Não foi possível atualizar o estoque para ${productName}. Por favor, contate o suporte.`,
        variant: 'destructive',
      });
      return false;
    }

    console.log(`✅ Estoque decrementado com sucesso para ${productName}. Novo estoque: ${newStock}`);
    console.log(`🔧 === FIM DECREMENTPRODUCTSTOCK (SUCESSO) ===\n`);
    return true;
  } catch (error) {
    console.error(`💥 Erro inesperado ao decrementar estoque para ${productName}:`, error);
    console.log(`🔧 === FIM DECREMENTPRODUCTSTOCK (EXCEÇÃO) ===\n`);
    return false;
  }
}

/**
 * Função principal para decrementar estoque de todos os itens do pedido
 */
export const handleStockDecrement = async (orderId: string, items: OrderItem[]): Promise<boolean> => {
  console.log('\n🔥 === INÍCIO HANDLESTOCKDECREMENT === ');
  console.log('🆔 Order ID:', orderId);
  console.log('📦 Items recebidos:', JSON.stringify(items, null, 2));
  console.log('📊 Quantidade de itens:', items.length);

  // Verificar se já foi decrementado usando localStorage
  const storageKey = `stock_decremented_${orderId}`;
  console.log('🔑 Chave de verificação:', storageKey);
  
  // Verificar se já foi decrementado
  const alreadyDecremented = localStorage.getItem(storageKey);
  console.log('🔍 Verificando se já foi decrementado:', alreadyDecremented);
  
  if (alreadyDecremented) {
    console.log('⚠️ Estoque já foi decrementado ou está sendo processado para este pedido. Ignorando.');
    toast.info('Estoque já foi decrementado anteriormente.');
    return true; // Já foi processado, retorna sucesso
  }

  // Marcar como em processamento para evitar chamadas duplicadas
  localStorage.setItem(storageKey, 'processing');
  
  console.log('🚀 Iniciando decremento de estoque para o pedido ' + orderId + '...');
  console.log('📦 Itens a processar:', items);

  let allSuccess = true;
  let processedCount = 0;

  try {
    let allDecremented = true;
    let processedItems = 0;

    for (const item of items) {
      // Normalizar o nome do produto (pode vir como 'name' ou 'nome')
      const productName = item.name || item.nome || '';
      // Normalizar a quantidade (pode vir como 'quantity' ou 'quantidade')
      const quantity = item.quantity || item.quantidade || 0;
      
      console.log(`\n🔄 Processando item: ${productName}`);
      console.log(`📊 Dados do item:`, {
        name: item.name,
        nome: item.nome,
        quantity: item.quantity,
        quantidade: item.quantidade,
        productName,
        quantity: quantity
      });
      
      // Verificar se já temos o product_id_supabase
      let productId = item.product_id_supabase;
      
      // Se não temos o product_id_supabase, tentar buscar pelo nome
      if (!productId && productName) {
        console.log(`⚠️ product_id_supabase não encontrado, buscando pelo nome...`);
        productId = await findProductIdByName(productName);
      }
      
      // Verificar se temos um ID válido e quantidade válida
      if (productId && quantity > 0) {
        console.log(`✅ Item válido para decremento:`);
        console.log(`   - Produto: ${productName}`);
        console.log(`   - ID: ${productId}`);
        console.log(`   - Quantidade: ${quantity}`);
        
        const success = await decrementProductStock(productId, quantity, productName);
        
        if (success) {
          processedItems++;
        } else {
          allDecremented = false;
        }
      } else {
        console.log(`❌ Item inválido para decremento:`);
        if (!productId) {
          console.log(`   - Produto não encontrado: ${productName}`);
        }
        if (!(quantity > 0)) {
          console.log(`   - Quantidade inválida: ${quantity}`);
        }
        allDecremented = false;
      }
    }
    
    // Resultado final
    if (allDecremented && processedItems > 0) {
      console.log(`✅ Salvando flag de decremento no localStorage: ${storageKey}`);
      localStorage.setItem(storageKey, 'true');
      console.log(`🎉 Todos os ${processedItems} itens do pedido ${orderId} tiveram o estoque decrementado com sucesso!`);
      toast({ 
        title: 'Estoque Atualizado!', 
        description: `O estoque de ${processedItems} produto(s) foi atualizado com sucesso.` 
      });
    } else if (processedItems > 0) {
      console.warn(`⚠️ Decremento parcial: ${processedItems} de ${items.length} itens processados para o pedido ${orderId}.`);
      toast({ 
        title: 'Estoque Parcialmente Atualizado', 
        description: `${processedItems} de ${items.length} produtos tiveram o estoque atualizado.`,
        variant: 'destructive',
      });
    } else {
      console.error(`❌ Nenhum item foi processado para o pedido ${orderId}.`);
      toast({ 
        title: 'Erro ao Atualizar Estoque', 
        description: 'Não foi possível atualizar o estoque de nenhum produto. Contate o suporte.',
        variant: 'destructive',
      });
    }
    
    console.log('🔥 === FIM HANDLESTOCKDECREMENT === ');
    return allSuccess;
  } catch (error) {
    console.error('❌ Erro ao decrementar estoque:', error);
    // Em caso de erro, remover a flag para permitir nova tentativa
    localStorage.removeItem(storageKey);
    allSuccess = false;
  }
};

/**
 * Função para verificar se o estoque já foi decrementado
 */
export function isStockAlreadyDecremented(orderId: string): boolean {
  const stockDecrementedKey = `${STOCK_DECREMENTED_KEY_PREFIX}${orderId}`;
  return localStorage.getItem(stockDecrementedKey) === 'true';
}

/**
 * Função para marcar manualmente que o estoque foi decrementado
 */
export function markStockAsDecremented(orderId: string): void {
  const stockDecrementedKey = `${STOCK_DECREMENTED_KEY_PREFIX}${orderId}`;
  localStorage.setItem(stockDecrementedKey, 'true');
  console.log(`✅ Pedido ${orderId} marcado como tendo estoque decrementado.`);
}