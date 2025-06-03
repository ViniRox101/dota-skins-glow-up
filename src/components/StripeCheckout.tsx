import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface StripeCheckoutProps {
  products: Product[];
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  products,
  disabled = false,
  variant = 'default',
  size = 'default',
  className,
}) => {
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (products.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a compra.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calcular o valor total dos produtos no carrinho
      const totalValue = products.reduce((total, product) => {
        return total + (product.price * product.quantity);
      }, 0);
      
      // Mostrar toast de carregamento
      toast({
        title: "Processando",
        description: "Preparando seu checkout...",
      });

      // Usar a função create-checkout do Supabase para criar uma sessão de checkout dinâmica
      const response = await fetch(
        "https://esjztlesvoqaquviasxl.supabase.co/functions/v1/create-checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ products }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar sessão de checkout");
      }

      const { url } = await response.json();
      window.location.href = url;

    } catch (error) {
      console.error("Erro ao processar checkout:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar o pagamento.",
        variant: "destructive",
      });
    }
  };

  // Calcular o valor total para exibir no botão
  const totalValue = products.reduce((total, product) => {
    return total + (product.price * product.quantity);
  }, 0);

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || products.length === 0}
      variant={variant}
      size={size}
      className={className}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      Finalizar Compra (R$ {totalValue.toFixed(2)})
    </Button>
  );
};

export default StripeCheckout;