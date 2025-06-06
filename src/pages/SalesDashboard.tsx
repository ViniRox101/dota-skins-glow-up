import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, DollarSign, Package, User, Clock, Search, Filter, Plus, CheckCircle, Edit, Check, CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const SalesDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [steamFilter, setSteamFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os pedidos.",
          variant: "destructive",
        });
        return;
      }

      setOrders(data || []);
      
      // Calcular estatísticas
      const completedOrders = data?.filter(order => order.status === 'completed') || [];
      const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
      setTotalRevenue(revenue);
      setTotalOrders(data?.length || 0);
      
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar os pedidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100); // Assumindo que o valor está em centavos
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Concluído', variant: 'default' as const },
      pending: { label: 'Pendente', variant: 'secondary' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      processing: { label: 'Processando', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, variant: 'outline' as const };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const parseOrderItems = (items: any): OrderItem[] => {
    try {
      let parsedItems = [];
      if (typeof items === 'string') {
        parsedItems = JSON.parse(items);
      } else if (Array.isArray(items)) {
        parsedItems = items;
      } else {
        return [];
      }
      
      // Mapear os campos para garantir compatibilidade com formatos antigos e novos
      return parsedItems.map((item: any) => ({
        id: item.id,
        name: item.name || item.nome, // Suporta tanto 'name' quanto 'nome'
        price: item.price || (item.preco ? item.preco * 100 : 0), // Converte preco para centavos se necessário
        quantity: item.quantity || item.quantidade || 1, // Suporta tanto 'quantity' quanto 'quantidade'
        image: item.image || item.imagem // Suporta tanto 'image' quanto 'imagem'
      }));
    } catch (error) {
      console.error('Erro ao parsear itens do pedido:', error);
      return [];
    }
  };

  const handleSteamAdd = async (orderId: string) => {
    try {
      // Encontrar o pedido atual
      const currentOrder = orders.find(o => o.id === orderId);
      if (!currentOrder) {
        throw new Error('Pedido não encontrado');
      }

      // Buscar todas as compras do mesmo usuário
      const userOrders = orders.filter(o => {
        // Comparar por user_id (se ambos tiverem) ou por email
        if (currentOrder.user_id && o.user_id) {
          return o.user_id === currentOrder.user_id;
        }
        return o.email === currentOrder.email;
      });

      // Verificar se já existe alguma compra com steam_add_date
      const existingSteamAdd = userOrders.find(o => o.steam_add_date);
      
      if (existingSteamAdd) {
        // Se já existe, apenas mostrar uma mensagem informativa
        const addDate = new Date(existingSteamAdd.steam_add_date);
        const now = new Date();
        const diffTime = now.getTime() - addDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, 30 - diffDays);
        
        toast({
          title: "Steam ADD já ativo!",
          description: `Este usuário já tem Steam ADD ativo. ${daysLeft} dias restantes.`,
        });
        return;
      }

      // Se não existe, definir a data atual para todas as compras do usuário que ainda não foram entregues
      const currentDate = new Date().toISOString();
      const ordersToUpdate = userOrders
        .filter(o => !o.steam_ready_to_send && !o.steam_add_date)
        .map(o => o.id);

      if (ordersToUpdate.length > 0) {
        const { error } = await supabase
          .from('orders')
          .update({ 
            steam_add_date: currentDate,
            steam_ready_to_send: false 
          })
          .in('id', ordersToUpdate);

        if (error) {
          throw error;
        }

        toast({
          title: "Steam ADD iniciado!",
          description: `Contagem de 30 dias iniciada para ${ordersToUpdate.length} compra(s) deste usuário.`,
        });
      } else {
        toast({
          title: "Nenhuma ação necessária",
          description: "Todas as compras deste usuário já foram processadas.",
        });
      }

      // Atualizar a lista de pedidos
      fetchOrders();
    } catch (error) {
      console.error('Erro ao iniciar Steam ADD (30 dias):', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar Steam ADD (30 dias). Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSteamId = async (orderId: string, newSteamId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ steam_id: newSteamId })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Steam ID atualizado!",
        description: "Steam ID foi salvo com sucesso.",
      });

      // Atualizar a lista de pedidos
      fetchOrders();
    } catch (error) {
      console.error('Erro ao atualizar Steam ID:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar Steam ID. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeliverItem = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ steam_ready_to_send: true })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Item entregue!",
        description: "O item foi marcado como entregue com sucesso.",
      });

      // Atualizar a lista de pedidos
      fetchOrders();
    } catch (error) {
      console.error('Erro ao entregar item:', error);
      toast({
        title: "Erro",
        description: "Erro ao entregar item. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getSteamAddStatus = (order: Order) => {
    // Se este pedido específico já foi entregue
    if (order.steam_ready_to_send === true) {
      return { status: 'delivered', daysLeft: 0 };
    }

    // Buscar a data mais antiga de Steam ADD para o mesmo usuário (compartilhado)
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

    // Usar a data mais antiga para calcular o tempo restante (compartilhado)
    const earliestAddDate = steamAddDates[0];
    const now = new Date();
    const diffTime = now.getTime() - earliestAddDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, 30 - diffDays);

    // Se o tempo acabou, verificar se ESTE pedido específico está pronto para entregar
    if (daysLeft === 0) {
      return { status: 'ready_to_deliver', daysLeft: 0 };
    } else {
      return { status: 'counting', daysLeft };
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de 30 dias Steam
    let matchesSteam = true;
    if (steamFilter !== 'all') {
      const steamStatus = getSteamAddStatus(order);
      
      switch (steamFilter) {
        case 'not_added':
          matchesSteam = steamStatus.status === 'not_started';
          break;
        case 'pending':
          matchesSteam = steamStatus.status === 'counting';
          break;
        case 'complete':
          matchesSteam = steamStatus.status === 'ready_to_deliver';
          break;
        case 'delivered':
          matchesSteam = steamStatus.status === 'delivered';
          break;
      }
    }
    
    let matchesDate = true;
    if (selectedDate) {
      const orderDate = new Date(order.created_at);
      const selectedDateString = selectedDate.toDateString();
      matchesDate = orderDate.toDateString() === selectedDateString;
    }
    
    return matchesSearch && matchesSteam && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total de Vendas</CardTitle>
            <Package className="h-4 w-4 text-neon-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalOrders}</div>
            <p className="text-xs text-gray-500">pedidos registrados</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Receita Total do Mês Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-neon-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-gray-500">vendas concluídas</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-neon-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-gray-500">receita total geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-neon-green" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Buscar por email ou ID</label>
              <Input
                placeholder="Digite o email ou ID do pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Filtro de 30 dias</label>
              <Select value={steamFilter} onValueChange={setSteamFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="not_added">30 Dias não adicionado</SelectItem>
                  <SelectItem value="pending">30 Dias faltante</SelectItem>
                  <SelectItem value="complete">30 Dias completo</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Data Específica</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="bg-gray-800 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={() => {
                setSearchTerm('');
                setSteamFilter('all');
                setSelectedDate(undefined);
              }}
              variant="outline"
              className="border-gray-700 text-gray-400 hover:bg-gray-800"
            >
              Limpar Filtros
            </Button>
            <Button 
              onClick={fetchOrders}
              className="bg-neon-green text-black hover:bg-neon-green/80"
            >
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de vendas */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">Nenhuma venda encontrada</h3>
              <p className="text-gray-500">Não há vendas que correspondam aos filtros aplicados.</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const orderItems = parseOrderItems(order.items);
            
            return (
              <Card key={order.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-neon-green" />
                        Pedido #{order.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(order.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.email}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-neon-green mb-2">
                        {formatCurrency(order.total)}
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-400">Itens do Pedido:</h4>
                    <div className="grid gap-2">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-white">{item.name}</p>
                              <p className="text-sm text-gray-400">Quantidade: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-neon-green">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(item.price)} cada
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-3 border-t border-gray-800">
                      <div className="flex justify-between items-center text-sm text-gray-400">
                        <span>Session ID:</span>
                        <span className="font-mono">{order.session_id}</span>
                      </div>
                      {order.user_id && (
                        <div className="flex justify-between items-center text-sm text-gray-400 mt-1">
                          <span>User ID:</span>
                          <span className="font-mono">{order.user_id}</span>
                        </div>
                      )}
                      
                      {/* Steam Actions */}
                      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                        <h5 className="text-white font-medium mb-3">Ações Steam</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Steam ADD Button */}
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Steam ADD (30 dias)</label>
                            {(() => {
                              const steamStatus = getSteamAddStatus(order);
                              
                              if (steamStatus.status === 'not_started') {
                                return (
                                  <Button
                                    onClick={() => handleSteamAdd(order.id)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    size="sm"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Steam ADD (30 dias)
                                  </Button>
                                );
                              } else if (steamStatus.status === 'counting') {
                                return (
                                  <Button
                                    disabled
                                    className="w-full bg-yellow-600 text-white cursor-not-allowed"
                                    size="sm"
                                  >
                                    <Clock className="mr-2 h-4 w-4" />
                                    {steamStatus.daysLeft} dias restantes
                                  </Button>
                                );
                              } else if (steamStatus.status === 'ready_to_deliver') {
                                return (
                                  <Button
                                    onClick={() => handleDeliverItem(order.id)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Entregar item
                                  </Button>
                                );
                              } else {
                                return (
                                  <div className="w-full bg-gray-600 text-white text-center py-2 px-3 rounded text-sm">
                                    <CheckCircle className="mr-2 h-4 w-4 inline" />
                                    Entregue
                                  </div>
                                );
                              }
                            })()
                            }
                          </div>
                          
                          {/* Steam ID Field */}
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Steam ID</label>
                            {order.steam_id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={order.steam_id}
                                  onChange={(e) => {
                                    // Apenas atualiza o valor local, não salva automaticamente
                                  }}
                                  className="bg-gray-700 border-gray-600 text-white text-xs"
                                  size="sm"
                                  id={`steam-input-${order.id}`}
                                />
                                <Button
                                  onClick={() => {
                                    const input = document.getElementById(`steam-input-${order.id}`) as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                      handleUpdateSteamId(order.id, input.value.trim());
                                    }
                                  }}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="76561198262445629 ou URL completa"
                                  className="bg-gray-700 border-gray-600 text-white text-xs placeholder-gray-500"
                                  size="sm"
                                  id={`steam-input-new-${order.id}`}
                                />
                                <Button
                                  onClick={() => {
                                    const input = document.getElementById(`steam-input-new-${order.id}`) as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                      handleUpdateSteamId(order.id, input.value.trim());
                                    }
                                  }}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SalesDashboard;