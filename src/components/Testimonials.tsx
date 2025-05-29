
import { useState, useEffect } from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: 'PlayerX',
      avatar: '🎮',
      rating: 5,
      text: 'Achei a skin que procurei por meses! Entrega super rápida e qualidade incrível.'
    },
    {
      id: 2,
      name: 'GamerPro',
      avatar: '⚔️',
      rating: 5,
      text: 'Melhor plataforma para skins de Dota 2. Preços justos e atendimento excelente.'
    },
    {
      id: 3,
      name: 'SkinCollector',
      avatar: '💎',
      rating: 4,
      text: 'Variedade incrível de skins exclusivas. Já comprei várias e todas chegaram perfeitas.'
    },
    {
      id: 4,
      name: 'DotatMaster',
      avatar: '🏆',
      rating: 5,
      text: 'Marketplace confiável e seguro. Consegui vender minhas skins sem problema algum.'
    }
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-neon-green' : 'text-gray-600'}>
        ⭐
      </span>
    ));
  };

  return (
    <section className="py-20 bg-gradient-to-b from-game-dark via-gray-900 to-game-dark relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyber-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            O que nossos <span className="text-neon-green">jogadores</span> dizem
          </h2>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-3xl font-bold text-neon-green">4.9</span>
            <div className="flex">
              {renderStars(5)}
            </div>
            <span className="text-gray-300">de 2.8k avaliações</span>
          </div>
        </div>

        {/* Testimonial Slider */}
        <div className="max-w-4xl mx-auto">
          <div className="relative h-64 overflow-hidden">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`absolute inset-0 transition-all duration-500 transform ${
                  index === currentTestimonial 
                    ? 'translate-x-0 opacity-100' 
                    : index < currentTestimonial 
                      ? '-translate-x-full opacity-0'
                      : 'translate-x-full opacity-0'
                }`}
              >
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-neon-green/30 transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-neon-green to-cyber-blue rounded-full flex items-center justify-center text-2xl mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{testimonial.name}</h4>
                      <div className="flex">
                        {renderStars(testimonial.rating)}
                      </div>
                    </div>
                  </div>
                  
                  <blockquote className="text-lg text-gray-300 italic leading-relaxed">
                    "{testimonial.text}"
                  </blockquote>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial ? 'bg-neon-green' : 'bg-gray-600 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="animate-fade-in">
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-sm text-gray-400">Pagamento Seguro</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm text-gray-400">Entrega Rápida</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-sm text-gray-400">Melhor Qualidade</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-2xl mb-2">💎</div>
            <div className="text-sm text-gray-400">100% Autêntico</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
