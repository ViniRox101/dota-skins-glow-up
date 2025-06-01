
const Features = () => {
  const features = [
    {
      icon: '🔒',
      title: '100% Seguro',
      description: 'Compra garantida e protegida com quem ta online todos os dias.'
    },
    {
      icon: '⚡',
      title: 'Atendimento exclusivo',
      description: 'acompanharemos sua compra do começo ao fim'
    },
    {
      icon: '💎',
      title: 'Skins Exclusivas',
      description: 'Designs únicos que só você vai ter'
    },
  ];

  return (
    <section id="sobre" className="py-20 bg-gradient-to-b from-gray-900 to-game-dark relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 animate-fade-in">
          <a href="/skins" className="inline-block mb-8">
            <button className="py-4 px-8 rounded-lg text-white text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
              Veja todas as skins do site
            </button>
          </a>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Por que escolher <span className="text-neon-green">DotaPlaySkins</span>?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Plataforma vinculada diretamente com o canal <span className="text-neon-green font-bold">Dota Play Brasil</span>, a mais confiável para comprar, vender ou trocar skins de dota 2.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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


      </div>
    </section>
  );
};

export default Features;
