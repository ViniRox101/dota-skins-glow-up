
const Features = () => {
  const features = [
    {
      icon: '🔒',
      title: '100% Seguro',
      description: 'Compra garantida e protegida com tecnologia de ponta'
    },
    {
      icon: '⚡',
      title: 'Entrega Instantânea',
      description: 'Skins liberadas em segundos após a confirmação'
    },
    {
      icon: '💎',
      title: 'Skins Exclusivas',
      description: 'Designs únicos que só você vai ter'
    },
    {
      icon: '🏪',
      title: 'Marketplace Integrado',
      description: 'Venda fácil e rápida das suas skins'
    }
  ];

  return (
    <section id="sobre" className="py-20 bg-gradient-to-b from-gray-900 to-game-dark relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Por que escolher <span className="text-neon-green">DotaPlaySkins</span>?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A plataforma mais confiável para comprar, vender e trocar skins de Dota 2
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-neon-green/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-neon-green transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-neon-green/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Stats section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 text-center">
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="text-4xl lg:text-5xl font-bold text-neon-green mb-2">1.2k+</div>
            <div className="text-gray-300">Skins Disponíveis</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <div className="text-4xl lg:text-5xl font-bold text-cyber-blue mb-2">25k+</div>
            <div className="text-gray-300">Jogadores Ativos</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <div className="text-4xl lg:text-5xl font-bold text-cyber-purple mb-2">4.9★</div>
            <div className="text-gray-300">Avaliação Média</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
