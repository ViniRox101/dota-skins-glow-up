import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-dark to-gray-900 text-white">
      <Header />
      <div className="container max-w-2xl mx-auto py-24 px-4">
        <Card className="bg-gray-800/50 border-red-500/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-400">Pagamento Cancelado</CardTitle>
            <CardDescription className="text-gray-300">
              Seu pagamento foi cancelado e nenhum valor foi cobrado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-700/50 p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-red-400">O que aconteceu?</h3>
              <p className="text-gray-200 mb-4">
                O processo de pagamento foi interrompido antes da conclusão. Isso pode ter ocorrido por diversos motivos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-200 ml-2">
                <li>Você decidiu cancelar a transação</li>
                <li>Houve um problema com o método de pagamento</li>
                <li>A sessão de pagamento expirou</li>
                <li>Ocorreu um erro durante o processamento</li>
              </ul>
            </div>
            
            <div className="bg-gray-700/50 p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-red-400">O que fazer agora?</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-200 ml-2">
                <li>Seus itens continuam no carrinho</li>
                <li>Você pode tentar novamente com outro método de pagamento</li>
                <li>Se encontrar problemas, entre em contato com nosso suporte</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              onClick={() => navigate('/cart')}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Voltar para o Carrinho
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a Loja
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default CancelPage;