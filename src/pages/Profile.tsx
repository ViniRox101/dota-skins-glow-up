import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, getSession, getCurrentUser, supabase } from '../integrations/supabase/client';
import { Camera, Loader2, Upload, User, ShoppingBag, Clock, Gamepad2, Package, Calendar, CheckCircle, AlertCircle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SteamIdManager from '@/components/SteamIdManager';
import type { Database } from '../integrations/supabase/types';

// Usando o tipo da tabela profiles diretamente do arquivo de tipos do Supabase
type Profile = Database['public']['Tables']['profiles']['Row'];

interface Order {
  id: string;
  created_at: string;
  email: string;
  items: any;
  session_id: string;
  status: string;
  total: number;
  updated_at: string;
  user_id: string | null;
  steam_id?: string | null;
  steam_add_date?: string | null;
  steam_ready_to_send?: boolean;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [steamId, setSteamId] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (!session) {
          navigate('/login');
          return;
        }
        
        const user = await getCurrentUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Carregar dados do usuário autenticado
        setUserEmail(user.email || '');
        
        // Criar um perfil básico com os dados do usuário autenticado
        const basicProfile: Profile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          steam_id: user.user_metadata?.steam_id || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at
        };
        
        setProfile(basicProfile);
        setFullName(basicProfile.full_name);
        setSteamId(basicProfile.steam_id);
        setAvatarUrl(basicProfile.avatar_url);
        
        console.log('User data loaded:', { userId: user.id, email: user.email });
        
        // Buscar compras do usuário
        await fetchUserOrders(user.id);
      } catch (error) {
        console.error('Error checking session:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const fetchUserOrders = async (userId: string) => {
    try {
      setLoadingOrders(true);
      
      // Buscar pedidos pelo user_id E pelo email do usuário
      const user = await getCurrentUser();
      const userEmail = user?.email || '';
      
      console.log('🔍 Buscando pedidos para:', { userId, userEmail });
      
      let allOrders: Order[] = [];
      const orderIds = new Set(); // Para evitar duplicatas
      
      // Primeira tentativa: buscar por user_id
      if (userId) {
        const { data: ordersByUserId, error: userIdError } = await supabase
          .from('orders')
          .select('*, steam_id, steam_add_date, steam_ready_to_send')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (!userIdError && ordersByUserId) {
          ordersByUserId.forEach(order => {
            if (!orderIds.has(order.id)) {
              allOrders.push(order);
              orderIds.add(order.id);
            }
          });
          console.log('📦 Pedidos encontrados por user_id:', ordersByUserId.length);
        } else if (userIdError) {
          console.error('❌ Erro ao buscar por user_id:', userIdError);
        }
      }
      
      // Segunda tentativa: buscar por email (sempre, não apenas se não encontrou por user_id)
      if (userEmail) {
        const { data: ordersByEmail, error: emailError } = await supabase
          .from('orders')
          .select('*, steam_id, steam_add_date, steam_ready_to_send')
          .eq('email', userEmail)
          .order('created_at', { ascending: false });
          
        if (!emailError && ordersByEmail) {
          ordersByEmail.forEach(order => {
            if (!orderIds.has(order.id)) {
              allOrders.push(order);
              orderIds.add(order.id);
            }
          });
          console.log('📦 Pedidos encontrados por email:', ordersByEmail.length);
        } else if (emailError) {
          console.error('❌ Erro ao buscar por email:', emailError);
        }
      }
      
      // Ordenar todos os pedidos por data de criação (mais recente primeiro)
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('📦 Total de pedidos encontrados:', allOrders.length);
      console.log('📋 Pedidos:', allOrders);
      setOrders(allOrders);
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;
    
    setUpdating(true);
    setMessage(null);
    
    try {
      // Atualizar metadados do usuário no Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          steam_id: steamId,
          avatar_url: avatarUrl
        }
      });

      if (error) throw error;
      
      // Atualizar o estado local
      const updatedProfile = {
        ...profile,
        full_name: fullName,
        steam_id: steamId,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };
      
      setProfile(updatedProfile);
      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      
      console.log('Profile updated successfully:', updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: 'Erro ao atualizar perfil.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !profile) {
      return;
    }

    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    setUploadingAvatar(true);
    setMessage(null);

    try {
      // Upload da imagem para o storage do Supabase
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Gera URL pública para a imagem
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Atualiza o avatar_url no perfil
      setAvatarUrl(data.publicUrl);
      setMessage({ text: 'Foto de perfil carregada com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      setMessage({ text: 'Erro ao fazer upload da imagem.', type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-game-dark text-white">
        <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para obter o status do Steam ADD (similar ao SalesDashboard)
  const getSteamAddStatus = (order: Order) => {
    // Se já foi entregue
    if (order.steam_ready_to_send === true) {
      return { status: 'delivered', daysLeft: 0 };
    }

    // Buscar a data mais antiga de Steam ADD para o mesmo usuário
    const userOrders = orders.filter(o => {
      // Comparar por user_id (se ambos tiverem) ou por email
      if (order.user_id && o.user_id) {
        return o.user_id === order.user_id;
      }
      return o.email === order.email;
    });

    // Encontrar a data mais antiga de steam_add_date entre todas as compras do usuário
    const steamAddDates = userOrders
      .filter(o => o.steam_add_date)
      .map(o => new Date(o.steam_add_date!))
      .sort((a, b) => a.getTime() - b.getTime());

    // Se nenhuma compra do usuário foi adicionada ainda
    if (steamAddDates.length === 0) {
      return { status: 'not_started', daysLeft: 30 };
    }

    // Usar a data mais antiga para calcular o tempo restante
    const earliestAddDate = steamAddDates[0];
    const now = new Date();
    const diffTime = now.getTime() - earliestAddDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, 30 - diffDays);

    if (daysLeft === 0) {
      return { status: 'ready_to_deliver', daysLeft: 0 };
    } else {
      return { status: 'counting', daysLeft };
    }
  };

  // Função para renderizar o status do Steam ADD
  const renderSteamStatus = (order: Order) => {
    const steamStatus = getSteamAddStatus(order);
    
    switch (steamStatus.status) {
      case 'not_started':
        return (
          <div className="flex items-center space-x-2 text-gray-400">
            <Timer className="w-4 h-4" />
            <span className="text-sm">Aguardando processamento</span>
          </div>
        );
      case 'counting':
        return (
          <div className="flex items-center space-x-2 text-yellow-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {steamStatus.daysLeft} {steamStatus.daysLeft === 1 ? 'dia restante' : 'dias restantes'}
            </span>
          </div>
        );
      case 'ready_to_deliver':
        return (
          <div className="flex items-center space-x-2 text-orange-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Pronto para entrega</span>
          </div>
        );
      case 'delivered':
        return (
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Entregue</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const getStatusBadge = (status: string) => {
    // Mapear diferentes status possíveis
    const statusMap: { [key: string]: { label: string; color: string; bg: string; border: string } } = {
      'approved': { label: 'Aprovado', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
      'paid': { label: 'Pago', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
      'pending': { label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
      'processing': { label: 'Processando', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
      'cancelled': { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
      'failed': { label: 'Falhou', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || statusMap['pending'];
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-game-dark text-white">
      <Header />
      <div className="container mx-auto pt-28 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-neon-green mb-2">Meu Perfil</h1>
            <p className="text-gray-400">Gerencie suas informações e acompanhe suas compras</p>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-600/30' : 'bg-red-900/30 text-red-400 border border-red-600/30'}`}>
              {message.text}
            </div>
          )}

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-700">
              <TabsTrigger value="profile" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
                <User className="w-4 h-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="steam" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
                <Gamepad2 className="w-4 h-4 mr-2" />
                Steam ID
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Minhas Compras
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Avatar Section */}
                <Card className="bg-gray-800/50 border border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Foto do Perfil
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div 
                      className="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-neon-green/50 cursor-pointer hover:border-neon-green transition-colors"
                      onClick={handleAvatarClick}
                    >
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700">
                          <User className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                        {uploadingAvatar ? (
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : (
                          <Camera className="w-8 h-8 text-white" />
                        )}
                      </div>
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={uploadAvatar}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    <p className="text-sm text-gray-400 text-center">Clique na imagem para alterar sua foto</p>
                  </CardContent>
                </Card>

                {/* Profile Info */}
                <Card className="lg:col-span-2 bg-gray-800/50 border border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-neon-green">Informações Pessoais</CardTitle>
                    <CardDescription className="text-gray-400">Atualize suas informações de perfil</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300 flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={userEmail}
                          disabled
                          className="bg-gray-700 border-gray-600 text-gray-300"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-300">
                          Nome Completo
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white focus:border-neon-green"
                          placeholder="Digite seu nome completo"
                        />
                      </div>
                    </div>


                    
                    <Separator className="bg-gray-700" />
                    
                    <div className="flex space-x-3">
                      <Button 
                        onClick={updateProfile} 
                        disabled={updating}
                        className="flex-1 bg-neon-green hover:bg-neon-green/80 text-black font-semibold"
                      >
                        {updating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Atualizando...
                          </>
                        ) : (
                          'Atualizar Perfil'
                        )}
                      </Button>
                      
                      <Button 
                        onClick={handleSignOut}
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        Sair
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="steam" className="mt-6">
              <div className="flex justify-center">
                <SteamIdManager />
              </div>
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <Card className="bg-gray-800/50 border border-gray-700">
                <CardHeader>
                  <CardTitle className="text-neon-green flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Histórico de Compras
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Acompanhe suas compras e status de entrega
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
                      <span className="ml-2 text-gray-400">Carregando compras...</span>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Nenhuma compra encontrada</p>
                      <p className="text-gray-500 text-sm">Suas compras aparecerão aqui após o pagamento</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
                        const orderTotal = parseFloat(order.total) / 100; // Converter de centavos para reais
                        
                        return (
                          <div key={order.id} className="border border-gray-700 rounded-lg p-6 bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
                            {/* Cabeçalho do Pedido */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                              <div className="flex items-center space-x-4 mb-3 lg:mb-0">
                                <div className="bg-neon-green/20 p-3 rounded-lg">
                                  <Package className="w-6 h-6 text-neon-green" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm text-gray-400">Pedido</span>
                                    <span className="font-mono text-lg font-bold text-neon-green bg-gray-800 px-3 py-1 rounded">
                                      #{order.id.slice(0, 8).toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-400 flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {formatDate(order.created_at)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end space-y-2">
                                {getStatusBadge(order.status)}
                                <div className="text-right">
                                  <p className="text-sm text-gray-400">Valor Total</p>
                                  <span className="text-2xl font-bold text-neon-green">
                                    {formatCurrency(orderTotal)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Status do Steam ADD */}
                            <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Status de Entrega Steam</h4>
                                  {renderSteamStatus(order)}
                                </div>
                                {order.steam_id && (
                                  <div className="text-right">
                                    <p className="text-xs text-gray-400 mb-1">Steam ID</p>
                                    <span className="text-sm font-mono text-neon-green bg-gray-800 px-2 py-1 rounded">
                                      {order.steam_id}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Lista de itens */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-white flex items-center text-lg">
                                <ShoppingBag className="w-5 h-5 mr-2 text-neon-green" />
                                Itens Comprados ({orderItems.length} {orderItems.length === 1 ? 'item' : 'itens'})
                              </h4>
                              <div className="grid gap-3">
                                {orderItems.map((item: any, index: number) => {
                                  const itemPrice = parseFloat(item.price) / 100; // Converter de centavos para reais
                                  const itemTotal = itemPrice * item.quantity;
                                  
                                  return (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
                                      <div className="flex items-center space-x-4">
                                        {item.image && (
                                          <div className="relative">
                                            <img 
                                              src={item.image} 
                                              alt={item.name}
                                              className="w-16 h-16 rounded-lg object-cover border border-gray-600"
                                            />
                                            {item.quantity > 1 && (
                                              <span className="absolute -top-2 -right-2 bg-neon-green text-black text-xs font-bold px-2 py-1 rounded-full">
                                                {item.quantity}x
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-semibold text-white text-lg">{item.name}</p>
                                          <div className="flex items-center space-x-4 mt-1">
                                            <p className="text-sm text-gray-400">
                                              Quantidade: <span className="text-white font-medium">{item.quantity}</span>
                                            </p>
                                            <p className="text-sm text-gray-400">
                                              Preço unitário: <span className="text-neon-green font-medium">{formatCurrency(itemPrice)}</span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-gray-400 mb-1">Subtotal</p>
                                        <span className="font-bold text-neon-green text-xl">
                                          {formatCurrency(itemTotal)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Informações sobre Entrega */}
              <Card className="bg-gray-800/50 border border-gray-700 mt-6">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Quando vou receber meus itens */}
                    <div>
                      <h3 className="text-lg font-semibold text-neon-green mb-3 flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        ➡ Quando vou receber meus itens?
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        Na maioria dos casos o prazo de envio é de até 30 dias. Esse tempo é necessário porque os itens são enviados como presente, o que permite que você os receba com segurança, sem precisar tornar seu perfil da Steam público. Assim, garantimos a sua privacidade e a integridade da transação.
                      </p>
                    </div>
                    
                    <Separator className="bg-gray-700" />
                    
                    {/* Regras Oficiais da Steam */}
                    <div>
                      <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center">
                        <Gamepad2 className="w-5 h-5 mr-2" />
                        📋 Regras Oficiais da Steam:
                      </h3>
                      <div className="space-y-3 text-gray-300 leading-relaxed">
                        <p>
                          Segundo as políticas oficiais da Steam, presentes recém-adquiridos devem permanecer na conta do comprador por pelo menos 30 dias antes de poderem ser negociados. Esta é uma medida de segurança implementada pela Valve para proteger contra fraudes e transações maliciosas. Além disso, a Steam aplica restrições de negociação que podem durar até 15 dias para contas sem autenticador móvel ativo.
                        </p>
                        <p>
                          Existem itens que podem ser enviados por proposta de troca. Essa opção exige que o seu perfil esteja configurado como público e apto a receber propostas. Caso prefira esse tipo de envio, é só nos avisar! Sempre verificamos se o item desejado está disponível para envio por proposta antes de concluir a transação.
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="bg-gray-700" />
                    
                    {/* Contato WhatsApp */}
                    <div className="text-center">
                      <p className="text-gray-400 mb-4">Caso tenha alguma dúvida entre em contato pelo WhatsApp</p>
                      <Button 
                        onClick={() => window.open('https://wa.link/196mnu', '_blank')}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                        Entrar em Contato
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;