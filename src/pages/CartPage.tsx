import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';


const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const handleCheckout = () => {
    // Aqui você pode implementar sua própria lógica de checkout
    // Por exemplo, redirecionar para uma página de checkout personalizada
    // ou integrar com outro provedor de pagamento
    alert('Funcionalidade de checkout será implementada em breve!');
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
                              <span className="text-xl font-bold text-white">
                                R$ {item.preco.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-9 w-9 rounded-full border-gray-500 bg-gray-700 text-white hover:bg-gray-600"
                              onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                            >
                              <Minus className="h-5 w-5" />
                            </Button>
                            <span className="w-10 text-center text-lg text-white font-medium">{item.quantidade}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-9 w-9 rounded-full border-gray-500 bg-gray-700 text-white hover:bg-gray-600"
                              onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-5 w-5" />
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
                  <CardTitle className="text-2xl font-semibold text-neon-green">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-300">Subtotal</span>
                      <span className="text-white font-medium">R$ {getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-neon-green">
                      <span className="text-neon-green">Total</span>
                      <span className="text-neon-green">R$ {getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleCheckout}
                    className="w-full bg-neon-green text-game-dark hover:bg-neon-green/90"
                  >
                    Finalizar Compra
                  </Button>
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