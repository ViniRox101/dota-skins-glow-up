// Script de Debug para Problema de Decremento Duplo
// Execute este script no console do navegador durante o teste

console.log('🔧 Script de Debug - Decremento de Estoque Iniciado');

// Interceptar chamadas para localStorage
const originalSetItem = localStorage.setItem;
const originalGetItem = localStorage.getItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.setItem = function(key, value) {
  if (key.includes('stock_decremented_') || key === 'cart') {
    console.log(`📝 localStorage.setItem: ${key} = ${value}`);
  }
  return originalSetItem.call(this, key, value);
};

localStorage.getItem = function(key) {
  const result = originalGetItem.call(this, key);
  if (key.includes('stock_decremented_') || key === 'cart') {
    console.log(`📖 localStorage.getItem: ${key} = ${result}`);
  }
  return result;
};

localStorage.removeItem = function(key) {
  if (key.includes('stock_decremented_') || key === 'cart') {
    console.log(`🗑️ localStorage.removeItem: ${key}`);
  }
  return originalRemoveItem.call(this, key);
};

// Interceptar chamadas para supabase.rpc
if (window.supabase && window.supabase.rpc) {
  const originalRpc = window.supabase.rpc;
  window.supabase.rpc = function(functionName, params) {
    if (functionName === 'decrement_stock_by_id') {
      console.log(`🔧 Supabase RPC Call: ${functionName}`, params);
      console.trace('Stack trace da chamada RPC:');
    }
    return originalRpc.call(this, functionName, params);
  };
}

// Função para verificar estado atual
function debugCurrentState() {
  console.log('\n=== ESTADO ATUAL DO DEBUG ===');
  console.log('🛒 Carrinho atual:', localStorage.getItem('cart'));
  
  // Verificar todas as chaves de decremento de estoque
  const stockKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('stock_decremented_')) {
      stockKeys.push(key);
    }
  }
  
  console.log('🔑 Chaves de decremento encontradas:', stockKeys);
  stockKeys.forEach(key => {
    console.log(`   ${key}: ${localStorage.getItem(key)}`);
  });
  
  console.log('=== FIM DO ESTADO ATUAL ===\n');
}

// Executar verificação inicial
debugCurrentState();

// Adicionar função global para verificação manual
window.debugStockState = debugCurrentState;

console.log('✅ Script de debug carregado!');
console.log('💡 Use debugStockState() para verificar o estado atual a qualquer momento');
console.log('🎯 Agora faça uma compra e observe os logs detalhados');