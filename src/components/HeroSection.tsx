
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductList from './ProductList'; // Importar ProductList

const HeroSection = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 3
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  const handleClick = () => {
    navigate('/skins');
  };

  return (
    <section id="home" className="min-h-screen bg-game-dark relative overflow-hidden flex items-center justify-center text-center">
      {/* Particles Background */}
      <div className="absolute inset-0">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-neon-green rounded-full opacity-70 animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/20 via-transparent to-cyber-blue/20" />

      <div className="container mx-auto px-4 pt-24 relative z-10">
        <div className="grid lg:grid-cols-1 gap-8 items-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
              A Skin Certa no{' '}
              <span className="text-transparent bg-gradient-to-r from-neon-green to-cyber-blue bg-clip-text">
                Lugar Certo
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 leading-relaxed">
              Colecione, venda ou troque skins lendárias com segurança e estilo. 
              Entre no mundo das skins épicas de Dota 2.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleClick}
                className="bg-neon-green text-game-dark px-8 py-4 rounded-lg font-bold text-lg hover:bg-neon-green/90 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Todas as Skins
              </button>
              <a href="https://www.youtube.com/@DotaPlayBrasil" target="_blank" rel="noopener noreferrer" className="border-2 border-neon-green text-neon-green px-8 py-4 rounded-lg font-bold text-lg hover:bg-neon-green hover:text-game-dark transition-all duration-300 flex items-center justify-center">
                Assistir Live
              </a>
            </div>

            <div className="flex items-center space-x-8 text-sm text-gray-400 justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span>+ de 30k inscritos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" />
                <span>Atendimento exclusivo</span>
              </div>
            </div>
          </div>
        </div>
        {/* ProductList para Mega Destaques */}
        <div className="mt-8">
          <ProductList isMegaFeaturedOnly={true} limit={4} noGrid={false} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
