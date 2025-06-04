import React, { useEffect, useState, useCallback } from 'react';
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

const MAX_RETRIES = 5; // Declarar MAX_RETRIES no escopo do módulo ou componente

const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    const componentSignal = abortController.signal; // Renomear para evitar conflito e para clareza

    const doFetchOrderDetails = async (currentSessionId: string, signal: AbortSignal, retryCount = 0, delay = 1000) => {
      setLoading(true);
      setError(null);
      console.log(`[Tentativa Global ${retryCount + 1}] Iniciando busca de detalhes do pedido com session_id: ${currentSessionId}`);

      // 1. Tentar buscar na tabela 'orders' primeiro
      try {
        console.log(`[Tentativa Tabela Orders ${retryCount + 1}] Buscando pedido da tabela orders...`);
        const { data: sessionAuthData } = await supabase.auth.getSession();
        const authToken = sessionAuthData?.session?.access_token;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        };

        // Etapa 1: Buscar o pedido principal
        const orderResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/orders?session_id=eq.${currentSessionId}&select=*&limit=1`,
          {
            method: 'GET',
            headers: headers,
            signal: signal,
          }
        );

        if (signal.aborted) {
          console.log('Busca (tabela orders) abortada.');
          setLoading(false);
          return;
        }

        if (orderResponse.ok) {
          const orderDataArray = await orderResponse.json();
          if (orderDataArray && orderDataArray.length > 0) {
            const order = orderDataArray[0];
            console.log('Pedido encontrado na tabela orders:', order);

            // Etapa 2: Buscar os itens do pedido
            const orderItemsResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/order_items?order_id=eq.${order.id}&select=quantity,price,items(id,nome,imagem_url,imagens)`,
              {
                method: 'GET',
                headers: headers,
                signal: signal,
              }
            );

            if (signal.aborted) {
              console.log('Busca (tabela order_items) abortada.');
              setLoading(false);
              return;
            }

            if (orderItemsResponse.ok) {
              const orderItemsData = await orderItemsResponse.json();
              console.log('Itens do pedido encontrados:', orderItemsData);

              // Verificar se orderItemsData é um array e não um objeto de erro
              if (Array.isArray(orderItemsData)) {
                const formattedItems = orderItemsData.map((oi: any) => {
                  // Adicionar verificação para oi.items antes de acessar suas propriedades
                  const itemName = oi.items?.nome || 'Nome Indisponível';
                  const itemImageUrl = oi.items?.imagem_url || oi.items?.imagens?.[0] || '/placeholder.svg';
                  
                  return {
                    name: itemName,
                    price: formatCurrency(oi.price / 100), // Assumindo oi.price é o preço unitário em centavos
                    quantity: oi.quantity,
                    image_url: itemImageUrl,
                  };
                });

                setOrderDetails({
                  id: order.id || currentSessionId.substring(0, 8).toUpperCase(),
                  date: new Date(order.created_at).toLocaleDateString('pt-BR'),
                  items: formattedItems,
                  total: formatCurrency(order.total_amount / 100),
                  customer_email: order.customer_details?.email || order.user_email || 'Email não disponível',
                });
                setLoading(false);
                clearCart();
                toast({ title: 'Pedido Carregado!', description: 'Detalhes do pedido carregados do banco de dados.' });
                return;
              } else {
                console.error('Erro: orderItemsData não é um array. Dados recebidos:', orderItemsData);
                // Continuar para o fallback da Edge Function
              }
            } else {
              const errorTextItems = await orderItemsResponse.text();
              console.error('Erro ao buscar itens do pedido (order_items):', orderItemsResponse.status, errorTextItems);
              // Continuar para o fallback da Edge Function se os itens não puderem ser carregados
            }
          } else {
            console.log('Nenhum pedido encontrado na tabela orders com o session_id fornecido.');
          }
        } else {
          const errorTextOrder = await orderResponse.text();
          console.error('Erro ao buscar pedido da tabela orders:', orderResponse.status, errorTextOrder);
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          console.warn('Busca (tabela orders/order_items) abortada via exceção.');
          setLoading(false);
          return;
        }
        console.error('Exceção ao buscar na tabela orders/order_items:', e);
      }

      if (signal.aborted) {
        console.log('Sinal abortado antes de tentar a Edge Function.');
        setLoading(false);
        return;
      }
      console.log(`[Tentativa Edge Function ${retryCount + 1}] Buscando detalhes via Edge Function...`);
      try {
        const { data: sessionAuthData } = await supabase.auth.getSession();
        const authToken = sessionAuthData?.session?.access_token;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        };

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-session-details?session_id=${currentSessionId}`,
          {
            method: 'GET',
            headers: headers,
            signal: signal, // Usar o signal passado para a função
          }
        );

        if (signal.aborted) {
          console.log('Busca (Edge Function) abortada.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro na requisição (Edge Function, tentativa ${retryCount + 1}):`, response.status, errorText);
          throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Resposta da Edge Function:', data);

        if (!data || !data.session) {
          throw new Error('Dados da sessão não encontrados na resposta da Edge Function');
        }

        const session = data.session;
        const lineItems = data.lineItems || [];

        interface ProductDetails {
          id: string;
          nome: string;
          imagem_url?: string;
          imagens?: string[];
        }

        const formattedItems = await Promise.all(lineItems.map(async (item: any) => {
          const productName = item.description || item.price?.product?.name || 'Produto Desconhecido';
          let imageUrl = item.price?.product?.images?.[0] || '/placeholder.svg';
          
          try {
              // Tentar buscar da tabela 'items'
              // Simplificando o select para tentar mitigar o erro de instanciação profunda
              const { data: productData, error: productError } = await supabase
                  .from('items') 
                  .select('id, nome, imagem_url, imagens') // Mantido por enquanto, mas monitorar se o erro de instanciação persiste
                  .eq('stripe_product_id', item.price?.product?.id) 
                  .maybeSingle<ProductDetails>(); // Adicionando tipo explícito

              if (productError && productError.code !== 'PGRST116') { 
                  console.warn('Erro ao buscar detalhes do produto no Supabase:', productError);
              }
              if (productData) {
                  imageUrl = productData.imagem_url || productData.imagens?.[0] || imageUrl;
              }
          } catch (e) {
              console.warn('Exceção ao buscar produto no Supabase:', e);
          }

          return {
            name: productName,
            price: formatCurrency((item.amount_total || item.price?.unit_amount || 0) / 100),
            quantity: item.quantity || 1,
            image_url: imageUrl,
          };
        }));      

        setOrderDetails({
          id: session.id?.substring(0, 8).toUpperCase() || currentSessionId.substring(0, 8).toUpperCase(),
          date: new Date((session.created || Date.now() / 1000) * 1000).toLocaleDateString('pt-BR'),
          items: formattedItems,
          total: formatCurrency((session.amount_total || 0) / 100),
          customer_email: session.customer_details?.email || session.customer_email || 'Email não disponível',
        });
        setLoading(false);
        clearCart();
        toast({ title: 'Sucesso!', description: 'Detalhes do pedido carregados com sucesso via Edge Function.' });
        return;

      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.warn(`Busca (Edge Function, tentativa ${retryCount + 1}) abortada via exceção.`);
          if (retryCount >= MAX_RETRIES - 1) {
              setLoading(false);
          }
          return;
        }
        console.error(`💔 Erro ao buscar dados da Edge Function (tentativa ${retryCount + 1}):`, fetchError);

        const nextDelay = Math.min(delay * 2, 30000);

        if (retryCount < MAX_RETRIES - 1 && !signal.aborted) { // Usar signal aqui
          console.log(`Tentando novamente em ${nextDelay / 1000}s... (Tentativa ${retryCount + 2})`);
          setTimeout(() => {
            if (!signal.aborted) { // Usar signal aqui
              doFetchOrderDetails(currentSessionId, signal, retryCount + 1, nextDelay); // Passar signal
            } else {
              console.log('Não tentando novamente, sinal já abortado antes do setTimeout callback.');
              setLoading(false);
            }
          }, nextDelay);
        } else {
          if (signal.aborted) { // Usar signal aqui
            console.log('Máximo de tentativas atingido, mas sinal já abortado.');
          } else {
            console.error('Máximo de tentativas atingido. Falha ao carregar detalhes do pedido.');
            setError(`Falha ao carregar detalhes do pedido após ${MAX_RETRIES} tentativas. Por favor, verifique sua conexão ou tente novamente mais tarde.`);
          }
          setLoading(false);
        }
      }
    };

    if (sessionId) {
      console.log('useEffect disparado com sessionId:', sessionId);
      doFetchOrderDetails(sessionId, componentSignal, 0); // Passar componentSignal
    } else {
      toast({
        title: 'Erro',
        description: 'ID da sessão não encontrado na URL.',
        variant: 'destructive',
      });
      setLoading(false);
      navigate('/');
    }

    return () => {
      console.log('Limpando useEffect da SuccessPage: Abortando requisições pendentes.');
      abortController.abort();
    };
  // Removido fetchOrderDetails das dependências pois está definido dentro do useEffect
  }, [sessionId, navigate, toast, clearCart]); 

  const formatCurrency = (value: number) => {
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
                                (e.target as HTMLImageElement).src = '/placeholder-item.svg';
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
                  {/* Botão de tentar novamente removido por enquanto */}
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