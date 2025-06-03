
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  name: string;
  price: string;
  quantity: number;
}

interface OrderDetails {
  id: string;
  date: string;
  items: OrderItem[];
  total: string;
  customer_email?: string;
}

const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    // Limpar o carrinho após o pagamento bem-sucedido
    clearCart();
    
    if (sessionId) {
      console.log('Iniciando busca de detalhes do pedido com session_id:', sessionId);
      fetchOrderDetails(sessionId);
    } else {
      console.error('Nenhum session_id encontrado na URL');
      setLoading(false);
    }
  }, [sessionId, clearCart]);

  const fetchOrderDetails = async (sessionId: string) => {
    try {
      setLoading(true);
      
      console.log('Buscando detalhes da sessão via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('get-session-details', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: new URLSearchParams({ session_id: sessionId }),
      });

      if (error) {
        console.error('Erro na Edge Function:', error);
        throw new Error(error.message || 'Erro ao buscar detalhes do pedido');
      }

      console.log('Resposta da Edge Function:', data);
      
      if (!data || !data.session) {
        throw new Error('Dados da sessão não encontrados');
      }
      
      const session = data.session;
      const lineItems = data.lineItems || [];
      
      const formattedItems = lineItems.map((item: any) => ({
        name: item.description || 'Produto',
        price: formatCurrency(item.amount_total / 100),
        quantity: item.quantity || 1
      }));

      setOrderDetails({
        id: sessionId.substring(0, 8).toUpperCase(),
        date: new Date(session.created * 1000).toLocaleDateString('pt-BR'),
        items: formattedItems,
        total: formatCurrency(session.amount_total / 100),
        customer_email: session.customer_details?.email
      });
      
      console.log('Detalhes do pedido carregados com sucesso');
      
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      
      // Usar dados básicos em caso de erro
      setOrderDetails({
        id: sessionId.substring(0, 8).toUpperCase(),
        date: new Date().toLocaleDateString('pt-BR'),
        items: [
          { name: 'Compra realizada com sucesso', price: 'R$ 0,00', quantity: 1 }
        ],
        total: 'R$ 0,00'
      });
      
      toast({
        title: "Pagamento confirmado",
        description: "Seu pagamento foi processado com sucesso. Alguns detalhes podem estar indisponíveis no momento.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const copyOrderId = () => {
    if (orderDetails?.id) {
      navigator.clipboard.writeText(orderDetails.id);
      toast({
        title: "Copiado!",
        description: "Número do pedido copiado para a área de transferência.",
      });
    }
  };

  const retryFetchOrderDetails = () => {
    if (sessionId) {
      toast({
        title: "Tentando novamente",
        description: "Buscando detalhes do seu pedido...",
      });
      fetchOrderDetails(sessionId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-dark to-gray-900 text-white">
      <Header />
      <div className="container max-w-2xl mx-auto py-24 px-4">
        <Card className="bg-gray-800/50 border-neon-green/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-neon-green">Pagamento Confirmado!</CardTitle>
            <CardDescription className="text-gray-300">
              Seu pedido foi processado com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-gray-700" />
                <Skeleton className="h-4 w-3/4 bg-gray-700" />
                <Skeleton className="h-20 w-full bg-gray-700 mt-4" />
              </div>
            ) : (
              <>
                <div className="bg-gray-700/50 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-300">Número do Pedido:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-neon-green">{orderDetails?.id || 'N/A'}</p>
                      <Button variant="ghost" size="icon" onClick={copyOrderId} className="h-6 w-6">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-300 mt-2">Data:</p>
                  <p className="text-gray-200">{orderDetails?.date || 'N/A'}</p>
                  {orderDetails?.customer_email && (
                    <>
                      <p className="text-sm font-medium text-gray-300 mt-2">Email:</p>
                      <p className="text-gray-200">{orderDetails.customer_email}</p>
                    </>
                  )}
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-md">
                  <h3 className="text-lg font-semibold mb-2 text-neon-green">Itens do Pedido</h3>
                  <div className="space-y-4">
                    {orderDetails?.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b border-gray-600 pb-3">
                        <div className="flex-grow">
                          <p className="text-gray-200 font-medium">{item.name}</p>
                          <p className="text-xs text-gray-400">Quantidade: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{item.price}</p>
                      </div>
                    ))}
                    <div className="pt-2 flex justify-between font-bold">
                      <p>Total</p>
                      <p className="text-neon-green">{orderDetails?.total}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-md">
                  <h3 className="text-lg font-semibold mb-2 text-neon-green">Próximos Passos</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-200">
                    <li>Você receberá um e-mail com os detalhes do seu pedido em breve.</li>
                    <li>Seus itens serão adicionados à sua conta Dota 2 automaticamente.</li>
                    <li>Em caso de problemas, entre em contato com nosso suporte com o número do pedido.</li>
                  </ol>
                  <Button 
                    onClick={retryFetchOrderDetails} 
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Carregando...' : 'Atualizar detalhes do pedido'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              onClick={() => navigate('/profile')}
              className="w-full bg-neon-green hover:bg-neon-green/80 text-black"
            >
              Ver Meu Perfil
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full border-neon-green/50 text-neon-green hover:bg-neon-green/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a Loja
            </Button>
            <Button
              variant="ghost"
              className="w-full text-gray-300 hover:text-white hover:bg-gray-700/50"
              onClick={() => window.open('steam://run/570', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Dota 2
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default SuccessPage;
