
import { useState, useEffect } from 'react';

const HeroSection = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

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

  return (
    <section id="home" className="min-h-screen bg-game-dark relative overflow-hidden flex items-center">
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

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
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

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-neon-green text-game-dark px-8 py-4 rounded-lg font-bold text-lg hover:bg-neon-green/90 transition-all duration-300 transform hover:scale-105 animate-glow-pulse">
                Explorar Skins
              </button>
              <button className="border-2 border-neon-green text-neon-green px-8 py-4 rounded-lg font-bold text-lg hover:bg-neon-green hover:text-game-dark transition-all duration-300">
                Ver Coleção
              </button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span>+1.2k skins disponíveis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" />
                <span>Entrega instantânea</span>
              </div>
            </div>
          </div>

          <div className="relative animate-slide-in-right">
            <div className="relative w-full h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-cyber-purple/30 to-cyber-blue/30 backdrop-blur-sm border border-neon-green/20">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-neon-green/10 to-transparent" />
              
              {/* Mock skin showcase */}
              <div className="absolute inset-8 grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="bg-game-dark/50 backdrop-blur-sm rounded-lg border border-neon-green/30 p-4 hover:border-neon-green transition-all duration-300 transform hover:scale-105">
                    <div className="w-full h-20 bg-gradient-to-br from-cyber-purple to-cyber-blue rounded mb-3" />
                    <div className="text-white text-sm font-semibold">Epic Skin #{item}</div>
                    <div className="text-neon-green text-xs">$49.99</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-neon-green rounded-full animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-cyber-blue rounded-full animate-float" style={{ animationDelay: '2s' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
