import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react'; // Importando ícones
import Header from '../components/Header'; // Importando o componente Header

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <div className="flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
          Sobre nós(sa) Comunidade :)
        </h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          O Dotaplay nasceu da paixão por Dota 2 e da vontade de criar um espaço onde a comunidade brasileira pudesse se encontrar, jogar, rir e competir. Começamos com vídeos e tutoriais sobre o jogo de forma despretensiosas, mas rapidamente nos tornamos um dos principais canais de Dota do Brasil no youtube, com milhares de inscritos, lives diárias e campeonatos que movimentam jogadores de todo o país.
        </p>
        <p className="text-lg text-gray-300 leading-relaxed mt-4">
          Aqui, a gente respira Dota — seja organizando a tradicional Dotaplay League, apresentando a caótica "Rinha de Ruins" ou apenas trocando aquela ideia marota no chat. Nosso conteúdo mistura competitividade, humor e muita interação com a galera que acompanha.
        </p>
      </div>

      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-600 mb-4">
          Nossa Comunidade
        </h2>
        <p className="text-lg text-gray-300 leading-relaxed">
          Mas o Dotaplay é muito mais do que só conteúdo ou campeonatos; é a nossa comunidade! Uma galera que, em muitos casos, joga junto há anos, criando laços, rivalidades saudáveis e, claro, memes inesquecíveis. Somos conhecidos por sermos unidos, nos ajudando dentro e fora das partidas, celebrando as vitórias e lamentando as derrotas (muitas vezes com muito bom humor). É uma turma antiga no jogo e no canal, sim, mas que mantém uma energia muito louca e engraçada, transformando qualquer live ou chat em um show à parte. Interação com o chat é nosso lema, e é ali que a magia acontece, onde a zoeira encontra a estratégia e todos se sentem em casa.
        </p>
        <p className="text-lg text-gray-300 leading-relaxed mt-4">
          Mais do que criar conteúdo, nosso propósito é fortalecer a cena brasileira de Dota, dar visibilidade para novos talentos e manter a chama da comunidade sempre acesa. Acreditamos que jogar vai muito além da vitória ou da derrota: é sobre construir histórias, amizades e, claro, colecionar aqueles memes inesquecíveis das partidas.
        </p>
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <p className="text-lg text-gray-300 leading-relaxed mb-8">
          O Dotaplay é por quem joga pra quem joga, pra quem só assiste e pra quem vive Dota. E se você chegou até aqui, já faz parte disso tudo.
        </p>
        <p className="text-lg text-gray-300 leading-relaxed mb-8">
          Compre os itens, nos acompanhe nas lives, participe dos campeonatos ou só cola no chat pra dar aquela risada. Estamos te esperando!
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/" className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition duration-300">
            <Home className="mr-2" size={20} />
            Voltar para a Home
          </Link>

        </div>
      </div>
    </div>
    </div>
  );
};

export default About;