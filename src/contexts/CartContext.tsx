import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { products as allProducts, Product as ProductType } from '../data/products'; // Importar produtos e o tipo Product
import { toast } from '@/components/ui/use-toast'; // Importar o toast


interface CartProduct {
  id: string;
  nome: string;
  preco: number;
  desconto_porcentagem: number | null;
  imagem: string;
  quantidade: number;
  stock: number; // Adicionar stock aqui
}

interface CartContextType {
  cartItems: CartProduct[];
  addToCart: (product: Omit<CartProduct, 'quantidade'> & { quantidade: number; stock: number }) => boolean; // Modificar o tipo de retorno
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  // isCheckingOut e proceedToCheckout foram removidos.
  // A lógica de checkout agora é tratada diretamente no CartPage.tsx.
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartProduct[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  // const [isCheckingOut, setIsCheckingOut] = useState(false); // Removido

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((productToAdd: Omit<CartProduct, 'quantidade'> & { quantidade: number; stock: number }): boolean => {
    let success = false;
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === productToAdd.id);
      let newQuantity;

      if (existingItemIndex >= 0) {
        newQuantity = prevItems[existingItemIndex].quantidade + productToAdd.quantidade;
      } else {
        newQuantity = productToAdd.quantidade;
      }

      if (productToAdd.stock < newQuantity) {
        toast({
          title: "Estoque insuficiente",
          description: `Desculpe, temos apenas ${productToAdd.stock} unidade(s) de ${productToAdd.nome} em estoque. Você não pode adicionar ${newQuantity}.`,
          variant: "destructive",
        });
        success = false;
        return prevItems; 
      }

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantidade = newQuantity;
        success = true;
        return updatedItems;
      } else {
        success = true;
        return [...prevItems, { 
          id: productToAdd.id, 
          nome: productToAdd.nome, 
          preco: productToAdd.preco, 
          desconto_porcentagem: productToAdd.desconto_porcentagem, 
          imagem: productToAdd.imagem, 
          quantidade: newQuantity, 
          stock: productToAdd.stock 
        }];
      }
    });
    return success;
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems(prevItems => {
      const itemInCart = prevItems.find(item => item.id === productId);

      if (!itemInCart) {
        toast({
          title: "Erro interno",
          description: "Produto não encontrado no carrinho ao tentar atualizar quantidade.",
          variant: "destructive",
        });
        return prevItems; // Retorna o estado anterior sem modificação
      }

      if (quantity <= 0) {
        // Se a quantidade for 0 ou menor, remove o item do carrinho
        return prevItems.filter(item => item.id !== productId);
      }

      // Usar o estoque do item que já está no carrinho
      if (itemInCart.stock < quantity) {
        toast({
          title: "Estoque insuficiente",
          description: `Desculpe, temos apenas ${itemInCart.stock} unidade(s) de ${itemInCart.nome} em estoque. Você não pode definir a quantidade para ${quantity}.`,
          variant: "destructive",
        });
        return prevItems; // Retorna o estado anterior sem modificação
      }

      // Atualiza a quantidade do item específico
      return prevItems.map(item =>
        item.id === productId ? { ...item, quantidade: quantity } : item
      );
    });
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const priceWithDiscount = item.desconto_porcentagem
        ? item.preco * (1 - item.desconto_porcentagem / 100)
        : item.preco;
      return total + (priceWithDiscount * item.quantidade);
    }, 0);
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantidade, 0);
  }, [cartItems]);

  // A função proceedToCheckout e o estado isCheckingOut foram removidos.
  // A lógica de checkout agora é tratada diretamente no CartPage.tsx.

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
    // isCheckingOut removido
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};