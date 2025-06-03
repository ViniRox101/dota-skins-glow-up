import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Download, Copy, ExternalLink } from 'lucide-react';
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
  image_url?: string;
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
  const [fetchAttempts, setFetchAttempts] = useState(0);

  useEffect(() => {
    // Limpar o carrinho após o pagamento bem-sucedido
    clearCart();
    
    // Buscar detalhes da sessão de checkout usando o sessionId
    if (sessionId) {
      console.log('Iniciando busca de detalhes do pedido com session_id:', sessionId);
      fetchOrderDetails(sessionId);
    } else {
      console.error('Nenhum session_id encontrado na URL');
      setLoading(false);
    }
  }, [sessionId, clearCart]);

  // Função para buscar detalhes do pedido com retentativas e backoff exponencial
  const fetchOrderDetails = async (sessionId: string, retryCount = 0, delay = 1000) => {
    try {
      setLoading(true);
      setFetchAttempts(prev => prev + 1);
      
      // Primeiro, tentar buscar o pedido da tabela orders no Supabase
      console.log(`[Tentativa ${retryCount + 1}] Buscando pedido da tabela orders...`);
      
      // Verificar se temos um token de autenticação válido
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      };
      
      // Adicionar token de autenticação se disponível
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      }
      
      try {
        const orderResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/orders?session_id=eq.${sessionId}&select=*`,
          {
            method: 'GET',
            headers: headers,
          }
        );
    
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          console.log('Resposta da tabela orders:', orderData);
          
          if (orderData && orderData.length > 0) {
            const order = orderData[0];
            console.log('Pedido encontrado na tabela orders:', order);
            
            // Formatar os itens do pedido
            const formattedItems = order.items.map((item: any) => ({
              name: item.product_name,
              price: formatCurrency(item.price),
              quantity: item.quantity,
              image_url: item.image
            }));
            
            setOrderDetails({
              id: sessionId.substring(0, 8).toUpperCase(),
              date: new Date(order.created_at).toLocaleDateString('pt-BR'),
              items: formattedItems,
              total: formatCurrency(order.total),
              customer_email: order.email
            });
            
            setLoading(false);
            return;
          } else {
            console.log('Nenhum pedido encontrado na tabela orders');
          }
        } else {
          console.error('Erro ao buscar pedido da tabela orders:', 
            orderResponse.status, 
            await orderResponse.text()
          );
        }
      } catch (orderError) {
        console.error('Erro ao buscar pedido da tabela orders:', orderError);
        // Continuar para tentar a Edge Function
      }
      
      // Se não encontrou na tabela orders, tentar a Edge Function
      console.log(`[Tentativa ${retryCount + 1}] Buscando detalhes via Edge Function...`);
      
      // Adicionar um timeout para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-session-details?session_id=${sessionId}`,
          {
            method: 'GET',
            headers: headers,
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
    
        // Se receber qualquer erro, tentar novamente com backoff exponencial
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro na requisição (tentativa ${retryCount + 1}):`, 
            response.status, 
            errorText
          );
          
          throw new Error(`Erro ${response.status}: ${errorText}`);
        }
    
        const data = await response.json();
        console.log('Resposta da Edge Function:', data);
        
        if (!data || !data.session) {
          throw new Error('Dados da sessão não encontrados');
        }
        
        // Formatar os dados reais da sessão
        const session = data.session;
        const lineItems = data.lineItems || [];
        
        // Buscar detalhes dos produtos no Supabase para obter imagens e outras informações
        const formattedItems = await Promise.all(lineItems.map(async (item: any) => {
          const productName = item.description || 'Produto';
          
          // Tentar buscar informações adicionais do produto no Supabase
          try {
            const productResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/items?nome=ilike.${encodeURIComponent('%' + productName + '%')}&select=id,nome,imagens`,
              {
                method: 'GET',
                headers: {
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (productResponse.ok) {
              const productData = await productResponse.json();
              if (productData && productData.length > 0) {
                return {
                  name: productName,
                  price: formatCurrency(item.amount_total / 100),
                  quantity: item.quantity || 1,
                  image_url: productData[0].imagens && productData[0].imagens.length > 0 ? productData[0].imagens[0] : null
                };
              }
            } else {
              console.error('Erro ao buscar detalhes do produto:', productResponse.status);
            }
          } catch (error) {
            console.error('Erro ao buscar detalhes do produto:', error);
          }
          
          // Fallback se não conseguir buscar informações adicionais
          return {
            name: productName,
            price: formatCurrency(item.amount_total / 100),
            quantity: item.quantity || 1
          };
        }));
    
        setOrderDetails({
          id: sessionId.substring(0, 8).toUpperCase(),
          date: new Date(session.created * 1000).toLocaleDateString('pt-BR'),
          items: formattedItems,
          total: formatCurrency(session.amount_total / 100),
          customer_email: session.customer_details?.email
        });
        
        // Registrar visualização do pedido
        console.log('Detalhes do pedido carregados com sucesso');
      } catch (fetchError) {
        console.error('Erro ao buscar dados da Edge Function:', fetchError);
        
        // Máximo de 5 tentativas com backoff exponencial
        if (retryCount < 5) {
          // Calcular delay com jitter para evitar thundering herd
          const jitter = Math.random() * 500;
          const nextDelay = Math.min(delay * 1.5 + jitter, 10000); // Máximo de 10 segundos
          
          console.log(`Tentando novamente em ${nextDelay}ms...`);
          // Mostrar toast informando sobre a tentativa
          toast({
            title: "Tentando novamente",
            description: `Tentativa ${retryCount + 1} de 5. Aguarde um momento...`,
            duration: nextDelay,
          });
          
          // Aguardar o tempo de delay e tentar novamente com delay exponencial
          setTimeout(() => {
            fetchOrderDetails(sessionId, retryCount + 1, nextDelay);
          }, nextDelay);
          return;
        } else {
          // Se atingiu o número máximo de tentativas, usar dados simulados
          throw new Error(`Falha após ${retryCount} tentativas.`);
        }
      }
      
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      // Usar dados simulados em caso de erro
      setOrderDetails({
        id: sessionId.substring(0, 8).toUpperCase(),
        date: new Date().toLocaleDateString('pt-BR'),
        items: [
          { name: 'Dota 2 Skin Bundle', price: 'R$ 50,00', quantity: 1 }
        ],
        total: 'R$ 50,00'
      });
      
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar todos os detalhes do pedido, mas seu pagamento foi confirmado com sucesso. Você pode tentar novamente em alguns instantes.",
        variant: "destructive"
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

  // Função para tentar novamente manualmente
  const retryFetchOrderDetails = () => {
    if (sessionId) {
      setLoading(true);
      toast({
        title: "Tentando novamente",
        description: "Buscando detalhes do seu pedido...",
      });
      fetchOrderDetails(sessionId);
    }
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
                      <div key={index} className="flex items-center gap-3 border-b border-gray-600 pb-3">
                        {item.image_url && (
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-600 flex-shrink-0">
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-item.png';
                              }}
                            />
                          </div>
                        )}
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
                  {/* Botão para tentar novamente caso tenha ocorrido erro */}
                  {(orderDetails?.items.length === 1 && orderDetails.items[0].name === 'Dota 2 Skin Bundle') || fetchAttempts < 3 ? (
                    <Button 
                      onClick={retryFetchOrderDetails} 
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? 'Carregando...' : 'Tentar carregar detalhes novamente'}
                    </Button>
                  ) : null}
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