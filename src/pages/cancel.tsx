import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingCart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';

const CancelPage: React.FC = () => {
  const navigate = useNavigate();
  const { getCartCount } = useCart();

  useEffect(() => {
    console.log('Página de cancelamento: Pedido não concluído.');
  }, []);

  const handleContinueShopping = () => {
    if (getCartCount() > 0) {
      navigate('/cart');
    } else {
      navigate('/skins');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-dark to-gray-900 text-white">
      <Header />
      <div className="container max-w-2xl mx-auto py-24 px-4">
        <Card className="bg-gray-800/50 border-red-500/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-400">Pedido Não Concluído</CardTitle>
            <CardDescription className="text-gray-300">
              Seu pedido não foi finalizado ou ocorreu um problema durante o processo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-700/50 p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-red-400">O que aconteceu?</h3>
              <p className="text-gray-200 mb-4">
                O processo de finalização do seu pedido foi interrompido antes da conclusão. 
                Isso pode ter ocorrido por diversos motivos, como o fechamento da página ou um cancelamento da sua parte.
              </p>
            </div>
            
            <div className="bg-gray-700/50 p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-yellow-400">O que fazer agora?</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-200 ml-2">
                {getCartCount() > 0 ? (
                  <li className="text-green-400 font-medium">✓ Seus itens continuam no carrinho. Você pode continuar o processo de compra.</li>
                ) : (
                  <li className="text-yellow-400">⚠ Não encontramos itens no seu carrinho. Que tal explorar nossos produtos?</li>
                )}
                <li>Se o problema persistir, entre em contato com nosso suporte.</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            {getCartCount() > 0 ? (
              <Button
                onClick={handleContinueShopping}
                className="w-full bg-neon-green text-game-dark hover:bg-neon-green/90"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Continuar Comprando ({getCartCount()} {getCartCount() === 1 ? 'item' : 'itens'})
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/skins')}
                className="w-full bg-neon-green text-game-dark hover:bg-neon-green/90"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Explorar Produtos
              </Button>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={() => navigate('/cart')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                disabled={getCartCount() === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Ver Carrinho
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="flex-1"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Página Inicial
              </Button>
            </div>
            
            <Button
              onClick={() => navigate('/contact')}
              className="w-full"
              variant="ghost"
            >
              Precisa de Ajuda? Entre em Contato
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default CancelPage;