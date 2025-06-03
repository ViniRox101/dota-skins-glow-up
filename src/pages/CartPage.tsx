import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import StripeCheckout from '@/components/StripeCheckout';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  // Formatar o produto para o formato esperado pelo StripeCheckout
  const formatProductsForCheckout = () => {
    return cartItems.map(item => ({
      id: item.id,
      name: item.nome,
      price: item.desconto_porcentagem 
        ? item.preco * (1 - item.desconto_porcentagem / 100) 
        : item.preco,
      quantity: item.quantidade
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-dark to-gray-900 text-white">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-4xl font-bold text-neon-green mb-8 text-center">Seu Carrinho</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <ShoppingCart className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Seu carrinho está vazio</h2>
            <p className="text-gray-400 mb-8">Adicione alguns produtos para continuar</p>
            <Button 
              onClick={() => navigate('/skins')} 
              className="bg-neon-green text-game-dark hover:bg-neon-green/90"
            >
              Explorar Skins
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {cartItems.map((item) => (
                <Card key={item.id} className="mb-4 bg-gray-800/50 border-neon-green/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-24 h-24 flex-shrink-0">
                        <img 
                          src={item.imagem} 
                          alt={item.nome} 
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-semibold text-neon-green">{item.nome}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            {item.desconto_porcentagem ? (
                              <div className="flex flex-col">
                                <span className="text-xl font-bold text-neon-green">
                                  R$ {(item.preco * (1 - item.desconto_porcentagem / 100)).toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                  R$ {item.preco.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xl font-bold">
                                R$ {item.preco.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-full border-gray-600"
                              onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantidade}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-full border-gray-600"
                              onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  className="text-red-500 border-red-500 hover:bg-red-500/10"
                  onClick={clearCart}
                >
                  Limpar Carrinho
                </Button>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="bg-gray-800/50 border-neon-green/20 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-xl">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal</span>
                      <span>R$ {getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-neon-green">
                      <span>Total</span>
                      <span>R$ {getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <StripeCheckout 
                    products={formatProductsForCheckout()} 
                    className="w-full bg-neon-green text-game-dark hover:bg-neon-green/90"
                  />
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;