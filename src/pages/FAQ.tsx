import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Header from '../components/Header';

const FAQ: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <div className="flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            Perguntas Frequentes
          </h1>
        </div>

        <div className="max-w-4xl mx-auto text-left space-y-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">➡ Quando vou receber meus itens?</h2>
            <p className="text-lg text-gray-300 mb-4">
              Na maioria dos casos o prazo de envio é de até 30 dias. Esse tempo é necessário porque os itens
              são enviados como presente, o que permite que você os receba com segurança, sem precisar
              tornar seu perfil da Steam público. Assim, garantimos a sua privacidade e a integridade da
              transação.<br />
              <br />
              <strong className="text-orange-400">📋 Regras Oficiais da Steam:</strong><br />
              Segundo as políticas oficiais da Steam, presentes recém-adquiridos devem permanecer na conta do comprador por pelo menos 30 dias antes de poderem ser negociados. Esta é uma medida de segurança implementada pela Valve para proteger contra fraudes e transações maliciosas. Além disso, a Steam aplica restrições de negociação que podem durar até 15 dias para contas sem autenticador móvel ativo.<br />
              <br />
              Existem itens que podem ser enviados por proposta de troca. Essa opção exige que o
              seu perfil esteja configurado como público e apto a receber propostas. Caso prefira esse tipo de
              envio, é só nos avisar! Sempre verificamos se o item desejado está disponível para envio por
              proposta antes de concluir a transação.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">➡ Por que posso confiar em vocês?</h2>
            <p className="text-lg text-gray-300 leading-relaxed">O Dotaplay está há anos online, ao vivo todos os dias, com milhares de inscritos e uma comunidade sólida. Nossa reputação é construída diariamente, com transparência, responsabilidade e respeito por quem nos acompanha. Para nós, confiança não é só uma palavra: é uma regra.</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">➡ E se eu tiver mais dúvidas?</h2>
            <p className="text-lg text-gray-300 leading-relaxed">Fique à vontade para entrar em contato com a nossa equipe pelo WhatsApp ou pelas redes sociais. Estamos sempre disponíveis para ajudar e garantir que sua experiência seja tranquila e segura.</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">➡ É possível pedir reembolso?</h2>
            <p className="text-lg text-gray-300 leading-relaxed">Não, não é possível. Os pagamentos são feitos via Pix e, assim que a transação é confirmada, o item é imediatamente reservado para você. Por isso, o pagamento é sempre antecipado, garantindo que ninguém mais possa comprar aquele item.</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">➡ Quais itens posso comprar?</h2>
            <p className="text-lg text-gray-300 leading-relaxed">Todos os itens que aparecem na nossa loja estão disponíveis. Assim que um cliente realiza o pagamento, o item é retirado do catálogo ou sinalizado como esgotado, evitando qualquer confusão. Trabalhamos sempre para manter a lista atualizada e transparente.</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">➡ Como funciona o envio como presente na Steam?</h2>
            <p className="text-lg text-gray-300 leading-relaxed">O envio como presente é uma forma segura e prática de entregar itens. Assim que o prazo de envio se cumpre, enviamos o item diretamente para a sua conta Steam como um presente. Isso significa que você não precisa tornar seu perfil público nem adicionar desconhecidos como amigos. A Steam permite que o envio de presentes seja feito diretamente, desde que os perfis estejam configurados para aceitar esse tipo de transação. Esse método é mais seguro e protege sua privacidade.</p>
          </div>
        </div>

        <div className="flex justify-center space-x-4 mt-12">
          <Link to="/" className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition duration-300">
            <Home className="mr-2" size={20} />
            Voltar para a Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;