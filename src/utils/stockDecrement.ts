import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface OrderItem {
  name: string;
  price: string;
  quantity: number;
  product_id_supabase?: string;
  image_url?: string;
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
    console.log(`🔧 Decrementando ${quantity} unidades do produto ${productName} (ID: ${productId})`);
    
    const { data: newStock, error: decrementError } = await supabase.rpc('decrement_stock_by_id', {
      p_product_id: productId,
      quantity_to_decrement: quantity,
    });

    if (decrementError) {
      console.error(`❌ Erro ao decrementar estoque para ${productName}:`, decrementError);
      toast({
        title: 'Erro ao Atualizar Estoque',
        description: `Não foi possível atualizar o estoque para ${productName}. Por favor, contate o suporte.`,
        variant: 'destructive',
      });
      return false;
    }

    console.log(`✅ Estoque decrementado com sucesso para ${productName}. Novo estoque: ${newStock}`);
    return true;
  } catch (error) {
    console.error(`💥 Erro inesperado ao decrementar estoque para ${productName}:`, error);
    return false;
  }
}

/**
 * Função principal para decrementar estoque de todos os itens do pedido
 */
export async function handleStockDecrement(orderId: string, items: OrderItem[]): Promise<void> {
  const stockDecrementedKey = `${STOCK_DECREMENTED_KEY_PREFIX}${orderId}`;
  
  // Verificar se o estoque já foi decrementado para este pedido
  if (localStorage.getItem(stockDecrementedKey)) {
    console.log(`✅ Estoque para o pedido ${orderId} já foi decrementado anteriormente.`);
    return;
  }

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
    localStorage.setItem(stockDecrementedKey, 'true');
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
}

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