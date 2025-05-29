
import { useState } from 'react';

const CTASection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-r from-cyber-purple via-cyber-blue to-neon-green relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-game-dark/90 to-game-dark/70" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              Entre para o mundo das <br />
              <span className="text-transparent bg-gradient-to-r from-neon-green via-cyber-blue to-cyber-purple bg-clip-text">
                skins épicas
              </span> agora mesmo
            </h2>
            
            <p className="text-xl text-gray-200 mb-12 max-w-2xl mx-auto leading-relaxed">
              Junte-se a milhares de jogadores que já descobriram as melhores skins de Dota 2. 
              Receba ofertas exclusivas e seja o primeiro a saber sobre novos lançamentos.
            </p>
          </div>

          {/* Email subscription form */}
          <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                className="flex-1 px-6 py-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:border-neon-green focus:bg-white/20 transition-all duration-300"
                required
              />
              <button
                type="submit"
                disabled={isSubmitted}
                className="px-8 py-4 bg-neon-green text-game-dark font-bold rounded-lg hover:bg-neon-green/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitted ? 'Enviado!' : 'Receber novidades'}
              </button>
            </form>
            
            {isSubmitted && (
              <div className="mt-4 text-neon-green font-semibold animate-fade-in">
                ✅ Obrigado! Você receberá nossas melhores ofertas em breve.
              </div>
            )}
          </div>

          {/* Main CTA button */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <button className="group relative px-12 py-6 bg-gradient-to-r from-neon-green to-cyber-blue text-game-dark font-bold text-xl rounded-xl hover:from-neon-green/90 hover:to-cyber-blue/90 transition-all duration-300 transform hover:scale-105 shadow-2xl">
              <span className="relative z-10">Começar agora</span>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple to-neon-green opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </button>
            
            <p className="text-sm text-gray-300 mt-4">
              Sem taxas de cadastro • Acesso imediato • Mais de 1.2k skins
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-70">
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-2">
                <span className="text-neon-green text-xl">🔒</span>
              </div>
              <span className="text-sm text-gray-300">SSL Seguro</span>
            </div>
            
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-2">
                <span className="text-cyber-blue text-xl">⚡</span>
              </div>
              <span className="text-sm text-gray-300">Entrega Instantânea</span>
            </div>
            
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-2">
                <span className="text-cyber-purple text-xl">💎</span>
              </div>
              <span className="text-sm text-gray-300">Skins Autênticas</span>
            </div>
            
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '0.9s' }}>
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-2">
                <span className="text-neon-green text-xl">🏆</span>
              </div>
              <span className="text-sm text-gray-300">Suporte 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
