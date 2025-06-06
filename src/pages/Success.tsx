import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowLeft, Gift, Star, User, Info, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { handleStockDecrement } from '@/utils/stockDecrement';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface OrderDetails {
  id?: string;
  sessionId: string;
  customerEmail?: string;
  totalAmount?: number;
  items?: any[];
  steam_id?: string | null;
  steam_ready_to_send?: boolean;
}

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyProcessed, setAlreadyProcessed] = useState(false);
  const [steamId, setSteamId] = useState('');
  const [steamIdSaved, setSteamIdSaved] = useState(false);
  const { toast } = useToast();
  const { clearCart } = useCart();

  const sessionId = searchParams.get('session_id');
  
  // Verificar se o pedido já foi processado usando localStorage
  const getOrderProcessedKey = (sessionId: string) => `order_processed_${sessionId}`;
  const isOrderProcessed = (sessionId: string) => {
    return localStorage.getItem(getOrderProcessedKey(sessionId)) === 'true';
  };
  const markOrderAsProcessed = (sessionId: string) => {
    localStorage.setItem(`order_processed_${sessionId}`, 'true');
  };

  const saveSteamId = async () => {
    if (!steamId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um Steam ID válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Steam ID não é mais armazenado na tabela orders
      // Esta funcionalidade foi removida
      console.log('Steam ID não é mais armazenado na tabela orders:', steamId);

      setSteamIdSaved(true);
      toast({
        title: "Steam ID registrado!",
        description: "Seu Steam ID foi registrado localmente.",
      });
    } catch (error) {
      console.error('Error processing Steam ID:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar Steam ID. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para salvar o pedido na tabela orders
  const saveOrderToDatabase = async (sessionId: string, cartItems: any[]) => {
    try {
      console.log('💾 Verificando se pedido já existe e salvando no banco de dados:', { sessionId, cartItems });
      
      // Verificar se já existe um pedido com este session_id
      const { data: existingOrder, error: checkError } = await supabase
        .from('orders')
        .select('id, session_id')
        .eq('session_id', sessionId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar pedido existente:', checkError);
        return false;
      }

      if (existingOrder) {
        console.log('ℹ️ Pedido já existe no banco de dados:', existingOrder.id);
        toast({
          title: "Pedido já registrado",
          description: "Este pedido já foi salvo no sistema anteriormente.",
        });
        return true;
      }
      
      // Mapear os itens do carrinho para o formato esperado pelo dashboard
      const mappedItems = cartItems.map(item => {
        const originalPrice = parseFloat(item.preco || item.price || '0');
        const discountPercentage = item.desconto_porcentagem || 0;
        // Calcular preço com desconto se houver desconto
        const finalPrice = discountPercentage > 0 
          ? originalPrice * (1 - discountPercentage / 100)
          : originalPrice;
        
        return {
          id: item.id,
          name: item.nome || item.name, // Mapear 'nome' para 'name'
          price: finalPrice * 100, // Converter para centavos usando preço com desconto
          quantity: parseInt(item.quantidade || item.quantity || '1'), // Mapear 'quantidade' para 'quantity'
          image: item.imagem || item.image // Mapear 'imagem' para 'image'
        };
      });
      
      console.log('🔄 Itens mapeados para o formato do dashboard:', mappedItems);
      
      // Calcular o total do pedido (em centavos)
      const total = mappedItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Buscar dados completos do usuário do perfil
      let userEmail = 'cliente@exemplo.com';
      let userSteamId = null;
      let userId = null;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('👤 Usuário logado encontrado:', user.id);
        userId = user.id;
        
        // Usar o email do usuário autenticado (que é o email real cadastrado)
        userEmail = user.email || 'cliente@exemplo.com';
        console.log('📧 Email do usuário autenticado:', userEmail);
        
        // Buscar Steam ID do perfil do usuário na tabela user_profiles
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('steam_id, full_name')
          .eq('user_id', user.id)
          .single();
          
        if (userProfile) {
          // Usar Steam ID do perfil (cadastrado pelo usuário)
          if (userProfile.steam_id) {
            userSteamId = userProfile.steam_id;
            console.log('🎮 Steam ID encontrado no perfil:', userSteamId);
          } else {
            console.log('ℹ️ Steam ID não encontrado no perfil do usuário');
          }
          console.log('👤 Nome completo do usuário:', userProfile.full_name);
        } else {
          console.log('⚠️ Perfil do usuário não encontrado na tabela user_profiles');
        }
        
        if (profileError) {
          console.error('❌ Erro ao buscar perfil do usuário:', profileError);
        }
      } else {
        console.log('ℹ️ Usuário não está logado');
      }

      // Preparar os dados do pedido
      const orderData = {
        session_id: sessionId,
        email: userEmail, // Email do perfil cadastrado pelo usuário
        items: mappedItems, // Salvar os itens mapeados como JSON
        total: total,
        status: 'completed',
        user_id: userId, // ID do usuário se estiver logado
        steam_id: userSteamId // Steam ID do perfil cadastrado pelo usuário
      };

      console.log('📋 Dados do pedido preparados:', orderData);

      // Salvar no Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (error) {
        console.error('❌ Erro ao salvar pedido:', error);
        toast({
          title: "Aviso",
          description: "Pedido processado, mas houve um problema ao salvar os dados.",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Pedido salvo com sucesso:', data);
      toast({
        title: "Pedido Registrado!",
        description: "Seu pedido foi salvo no sistema com sucesso.",
      });
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar pedido:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        // Buscar o pedido no banco de dados
        const { data: order, error } = await supabase
          .from('orders')
          .select('id, session_id, email, total, items, created_at')
          .eq('session_id', sessionId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar pedido:', error);
        }

        if (order) {
          // Se o pedido existe no banco, usar os dados do banco
          const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          const orderDetailsFromDB: OrderDetails = {
            id: order.id,
            sessionId: order.session_id,
            customerEmail: order.email,
            totalAmount: parseFloat(order.total) / 100, // Converter de centavos para reais
            items: parsedItems,
            steam_id: order.steam_id || null,
            steam_ready_to_send: order.steam_ready_to_send || false
          };
          setOrderDetails(orderDetailsFromDB);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes do pedido:', error);
      }

      // Se não encontrou no banco, processar como novo pedido
      if (!isOrderProcessed(sessionId)) {
        console.log('🔄 Iniciando processamento do pedido:', sessionId);
        
        // Marcar como processado imediatamente para evitar duplicatas
        markOrderAsProcessed(sessionId);
        
        // Recupera os itens do carrinho antes de limpar
        const cartItems = localStorage.getItem('cart');
        let parsedCartItems = [];
        
        if (cartItems) {
          try {
            parsedCartItems = JSON.parse(cartItems);
            console.log('🛒 Itens do carrinho recuperados:', parsedCartItems);
          } catch (error) {
            console.error('Erro ao parsear itens do carrinho:', error);
          }
        }

        // Calcular o total do pedido considerando descontos
        const totalAmount = parsedCartItems.reduce((sum, item) => {
          const originalPrice = parseFloat(item.preco || item.price || '0');
          const discountPercentage = item.desconto_porcentagem || 0;
          // Calcular preço com desconto se houver desconto
          const finalPrice = discountPercentage > 0 
            ? originalPrice * (1 - discountPercentage / 100)
            : originalPrice;
          const quantity = parseInt(item.quantidade || item.quantity || '1');
          return sum + (finalPrice * quantity);
        }, 0);

        const mockOrderDetails: OrderDetails = {
          sessionId,
          customerEmail: 'cliente@exemplo.com',
          totalAmount: totalAmount,
          items: parsedCartItems
        };

        setOrderDetails(mockOrderDetails);
        setLoading(false);

        // Processar o pedido: salvar no banco e decrementar estoque
        if (parsedCartItems.length > 0) {
          // 1. Salvar o pedido no banco de dados
          console.log('💾 Salvando pedido no dashboard de vendas...');
          saveOrderToDatabase(sessionId, parsedCartItems)
            .then((saved) => {
              if (saved) {
                console.log('✅ Pedido salvo no dashboard com sucesso');
                // Recarregar os detalhes do pedido do banco após salvar
                loadOrderDetails();
              }
            })
            .catch((error) => {
              console.error('❌ Erro ao salvar pedido no dashboard:', error);
            });

          // 2. Decrementar o estoque dos itens comprados
          console.log('🔄 Iniciando decrementação de estoque para o pedido:', sessionId);
          handleStockDecrement(sessionId, parsedCartItems)
            .then(() => {
              console.log('✅ Decrementação de estoque concluída');
            })
            .catch((error) => {
              console.error('❌ Erro na decrementação de estoque:', error);
            });
        } else {
          console.warn('⚠️ Nenhum item encontrado no carrinho para processar');
        }

        // Limpa o carrinho do localStorage e do contexto após compra bem-sucedida
        localStorage.removeItem('cart');
        clearCart();

        toast({
          title: "Pagamento realizado com sucesso!",
          description: "Seu pedido foi processado e registrado no sistema.",
          duration: 5000,
        });
      } else {
        // Pedido já foi processado, apenas mostrar os detalhes
        console.log('ℹ️ Pedido já foi processado anteriormente:', sessionId);
        
        toast({
          title: "Pedido já processado",
          description: "Este pedido já foi registrado no sistema anteriormente.",
          duration: 3000,
        });
      }
    };

    if (sessionId) {
      loadOrderDetails();
    } else {
      setLoading(false);
    }
  }, [sessionId, toast]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-game-dark flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-green"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!sessionId || !orderDetails) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-game-dark flex items-center justify-center pt-20">
          <Card className="w-full max-w-md bg-gray-900 border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-red-400">Erro</CardTitle>
              <CardDescription className="text-gray-300">
                Não foi possível encontrar os detalhes do seu pedido.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/">
                <Button className="w-full bg-neon-green hover:bg-neon-green/80 text-game-dark">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-game-dark pt-20 pb-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-neon-green/10 to-cyber-blue/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neon-green/20 border-2 border-neon-green">
              <CheckCircle className="h-10 w-10 text-neon-green" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Pagamento Realizado com <span className="text-neon-green">Sucesso!</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Obrigado pela sua compra. Seu pedido foi processado com sucesso.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Order Details Card */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Package className="mr-2 h-5 w-5 text-neon-green" />
                    Detalhes do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Número do Pedido:</span>
                        <span className="font-mono text-xs text-neon-green bg-gray-700 px-2 py-1 rounded">
                          #{orderDetails.id ? orderDetails.id.slice(0, 8) : sessionId.slice(0, 8)}
                        </span>
                      </div>
                      {orderDetails.customerEmail && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">E-mail:</span>
                          <span className="text-white">{orderDetails.customerEmail}</span>
                        </div>
                      )}
                      {orderDetails.totalAmount && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total:</span>
                          <span className="text-neon-green font-bold">
                            R$ {orderDetails.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Itens:</span>
                        <span className="text-white">{orderDetails.items?.length || 0} produto(s)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Data/Hora:</span>
                        <span className="text-white">
                          {new Date().toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista de itens comprados */}
                  {orderDetails.items && orderDetails.items.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="text-white font-semibold mb-3">Itens Comprados:</h4>
                      <div className="space-y-2">
                        {orderDetails.items.map((item: any, index: number) => {
                          const itemName = item.nome || item.name || 'Item sem nome';
                          // Os preços vêm em centavos do banco de dados, então dividimos por 100
                          const itemOriginalPrice = parseFloat(item.preco || item.price || '0') / 100;
                          const itemQuantity = parseInt(item.quantidade || item.quantity || '1');
                          const discountPercentage = item.desconto_porcentagem || 0;
                          
                          // Calcular preço com desconto se houver desconto
                          const itemPrice = discountPercentage > 0 
                            ? itemOriginalPrice * (1 - discountPercentage / 100)
                            : itemOriginalPrice;
                          
                          const itemTotal = itemPrice * itemQuantity;
                          
                          return (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                              <div className="flex-1">
                                <div className="text-white font-medium">{itemName}</div>
                                <div className="text-gray-400 text-sm">
                                  {discountPercentage > 0 ? (
                                    <>
                                      {itemQuantity}x 
                                      <span className="line-through text-gray-500 mr-2">
                                        R$ {itemOriginalPrice.toFixed(2)}
                                      </span>
                                      <span className="text-neon-green font-semibold">
                                        R$ {itemPrice.toFixed(2)}
                                      </span>
                                      <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                                        -{discountPercentage}%
                                      </span>
                                    </>
                                  ) : (
                                    <>{itemQuantity}x R$ {itemPrice.toFixed(2)}</>
                                  )}
                                </div>
                              </div>
                              <div className="text-neon-green font-semibold">
                                R$ {itemTotal.toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                  }
                  
                  {/* WhatsApp Contact Button */}
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="h-5 w-5 text-green-400" />
                        <div>
                          <h4 className="text-white font-semibold">Precisa de suporte ou tem alguma dúvida?</h4>
                          <p className="text-gray-300 text-sm">Entre em contato no nosso WhatsApp</p>
                        </div>
                      </div>
                      <a
                        href="https://wa.me/5511999999999?text=Olá,%20tenho%20uma%20dúvida%20sobre%20meu%20pedido"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Contato</span>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações de Entrega */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Gift className="mr-2 h-5 w-5 text-neon-green" />
                    ➡ Quando vou receber meus itens?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-white font-semibold mb-3 flex items-center">
                      📋 Regras Oficiais da Steam:
                    </h4>
                    <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                      <p>
                        Segundo as políticas oficiais da Steam, presentes recém-adquiridos devem permanecer na conta do comprador por pelo menos 30 dias antes de poderem ser negociados. Esta é uma medida de segurança implementada pela Valve para proteger contra fraudes e transações maliciosas. Além disso, a Steam aplica restrições de negociação que podem durar até 15 dias para contas sem autenticador móvel ativo.
                      </p>
                      <p>
                        Existem itens que podem ser enviados por proposta de troca. Essa opção exige que o seu perfil esteja configurado como público e apto a receber propostas. Caso prefira esse tipo de envio, é só nos avisar! Sempre verificamos se o item desejado está disponível para envio por proposta antes de concluir a transação.
                      </p>
                    </div>
                  </div>
                  

                  
                  {/* ID Steam do Administrador */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="text-center">
                      <h4 className="text-white font-semibold mb-2">Copie o ID Steam do nosso administrador para agilizar a entrega do seu item</h4>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-gray-300 text-sm mb-2">ID Steam do Administrador:</p>
                        <div className="flex items-center justify-center space-x-2">
                          <code className="text-neon-green font-mono text-lg bg-gray-700 px-3 py-2 rounded">
                            17492939
                          </code>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText('17492939');
                              toast({
                                title: "Copiado!",
                                description: "ID Steam copiado para a área de transferência.",
                              });
                            }}
                            size="sm"
                            className="bg-neon-green hover:bg-neon-green/80 text-game-dark"
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Success;