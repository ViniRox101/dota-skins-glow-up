import React, { useState, useEffect } from 'react';
import { Copy, Clock, MessageCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SteamActionsProps {
  order: {
    id: string;
    steam_ready_to_send: boolean;
    steam_add_date: string | null;
  };
}

const SteamActions: React.FC<SteamActionsProps> = ({ order }) => {
  const { toast } = useToast();
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const ADMIN_STEAM_ID = '17492939';
  const WHATSAPP_NUMBER = '5511999999999'; // Substitua pelo número real do WhatsApp
  const WHATSAPP_MESSAGE = 'Olá! Meu pedido está pronto para receber o item Steam. ID do pedido: ' + order.id;

  // Função para copiar o Steam ID do admin
  const copyAdminSteamId = async () => {
    try {
      await navigator.clipboard.writeText(ADMIN_STEAM_ID);
      toast({
        title: 'Steam ID copiado!',
        description: 'O Steam ID do administrador foi copiado para a área de transferência.',
        variant: 'default',
      });
    } catch (err) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o Steam ID. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Função para calcular o tempo restante
  const calculateTimeRemaining = () => {
    if (!order.steam_add_date) return null;

    const addDate = new Date(order.steam_add_date);
    const expiryDate = new Date(addDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();

    if (diff <= 0) {
      setIsExpired(false); // Na verdade, quando expira, o item está pronto
      return null;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  // Atualizar o cronômetro a cada segundo
  useEffect(() => {
    if (order.steam_add_date && !order.steam_ready_to_send) {
      const interval = setInterval(() => {
        const remaining = calculateTimeRemaining();
        setTimeRemaining(remaining);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [order.steam_add_date, order.steam_ready_to_send]);

  // Calcular o tempo inicial
  useEffect(() => {
    if (order.steam_add_date && !order.steam_ready_to_send) {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
    }
  }, [order.steam_add_date, order.steam_ready_to_send]);

  // Função para abrir o WhatsApp
  const openWhatsApp = () => {
    const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Determinar o status baseado na lógica correta
  const getSteamStatus = () => {
    // Se não tem steam_add_date, está aguardando adição
    if (!order.steam_add_date) {
      return 'awaiting_addition';
    }

    // Se já foi entregue
    if (order.steam_ready_to_send === true) {
      return 'delivered';
    }

    // Calcular se os 30 dias passaram
    const addDate = new Date(order.steam_add_date);
    const now = new Date();
    const diffTime = now.getTime() - addDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 30) {
      return 'ready_for_contact';
    } else {
      return 'counting_down';
    }
  };

  const status = getSteamStatus();

  // Estado 1: Aguardando adição na Steam (sem steam_add_date)
  if (status === 'awaiting_addition') {
    return (
      <div className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-4 space-y-3 backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-orange-400">
          <Clock className="h-5 w-5" />
          <h4 className="font-semibold">Aguardando Adição na Steam</h4>
        </div>
        <p className="text-gray-300 text-sm">
          Para receber seu item, você precisa adicionar o administrador na Steam.
        </p>
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm font-medium text-orange-400">Steam ID do Admin:</span>
          <code className="bg-gray-800 border border-gray-700 px-3 py-1 rounded text-sm font-mono text-neon-green">{ADMIN_STEAM_ID}</code>
          <Button
            size="sm"
            variant="outline"
            onClick={copyAdminSteamId}
            className="h-8 px-2 border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400">
          Após adicionar o administrador, aguarde a ativação do contador de 30 dias.
        </p>
      </div>
    );
  }

  // Estado 2: Contagem regressiva ativa (tem steam_add_date mas ainda não completou 30 dias)
  if (status === 'counting_down' && timeRemaining) {
    return (
      <div className="bg-gray-900/50 border border-blue-500/30 rounded-lg p-4 space-y-3 backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-blue-400">
          <Clock className="h-5 w-5" />
          <h4 className="font-semibold">Contagem Regressiva Ativa</h4>
        </div>
        <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-3 mb-3">
          <p className="text-neon-green text-sm font-semibold">
            🎉 Parabéns! Você foi adicionado com sucesso!
          </p>
          <p className="text-gray-300 text-xs mt-1">
            Agora aguarde o tempo necessário até que a Steam libere o item para entrega.
          </p>
        </div>
        <p className="text-gray-300 text-sm">
          Tempo restante para receber seu item Steam:
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2">
            <div className="text-lg font-bold text-neon-green">{timeRemaining.days}</div>
            <div className="text-xs text-gray-400">Dias</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2">
            <div className="text-lg font-bold text-neon-green">{timeRemaining.hours}</div>
            <div className="text-xs text-gray-400">Horas</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2">
            <div className="text-lg font-bold text-neon-green">{timeRemaining.minutes}</div>
            <div className="text-xs text-gray-400">Min</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2">
            <div className="text-lg font-bold text-neon-green">{timeRemaining.seconds}</div>
            <div className="text-xs text-gray-400">Seg</div>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Quando o contador zerar, você poderá entrar em contato para receber o item.
        </p>
      </div>
    );
  }

  // Estado 3: Pronto para contato (30 dias se passaram mas ainda não foi entregue)
  if (status === 'ready_for_contact') {
    return (
      <div className="bg-gray-900/50 border border-neon-green/30 rounded-lg p-4 space-y-3 backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-neon-green">
          <CheckCircle className="h-5 w-5" />
          <h4 className="font-semibold">Pronto para Receber o Item!</h4>
        </div>
        <p className="text-gray-300 text-sm">
          Os 30 dias se passaram! Agora você pode entrar em contato para receber seu item Steam.
        </p>
        <Button
          onClick={openWhatsApp}
          className="w-full bg-neon-green hover:bg-neon-green/80 text-black font-semibold transition-colors"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Entrar em Contato via WhatsApp
        </Button>
        <p className="text-xs text-gray-400">
          Clique no botão acima para abrir o WhatsApp com uma mensagem pré-definida.
        </p>
      </div>
    );
  }

  // Estado 4: Item já entregue
  return (
    <div className="bg-gray-900/50 border border-gray-600/30 rounded-lg p-4 space-y-3 backdrop-blur-sm">
      <div className="flex items-center space-x-2 text-neon-green">
        <CheckCircle className="h-5 w-5" />
        <h4 className="font-semibold">Item Entregue</h4>
      </div>
      <p className="text-gray-300 text-sm">
        Seu item Steam já foi entregue com sucesso!
      </p>
    </div>
  );
};

export default SteamActions;