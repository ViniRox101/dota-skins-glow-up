
import { useState } from 'react';
import { products } from '@/data/products'; // Importar os dados dos produtos
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

const SkinShowcase = () => {
  const navigate = useNavigate();
  const featuredProducts = products.filter(product => product.isFeatured);

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, featuredProducts.length - 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, featuredProducts.length - 3)) % Math.max(1, featuredProducts.length - 3));
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      'Arcana': 'from-red-500 to-orange-500',
      'Immortal': 'from-yellow-400 to-orange-500',
      'Legendary': 'from-purple-500 to-pink-500',
      'Mythical': 'from-purple-400 to-blue-500',
      'Divine': 'from-cyan-400 to-blue-500',
      'Cosmic': 'from-green-400 to-cyan-500',
      'Manopla': 'from-red-500 to-orange-500', // Adicionado para a nova categoria
      'Capa': 'from-purple-400 to-blue-500', // Adicionado para a nova categoria
      'Espada': 'from-yellow-400 to-orange-500', // Adicionado para a nova categoria
      'Gancho': 'from-green-400 to-cyan-500', // Adicionado para a nova categoria
    };
    return colors[rarity as keyof typeof colors] || 'from-gray-400 to-gray-600';
  };

  if (featuredProducts.length === 0) {
    return null; // Não renderiza a seção se não houver produtos em destaque
  }

  return (
    <section id="featured-skins" className="py-20 bg-gradient-to-b from-game-dark to-gray-900 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            <span className="text-neon-green">Destaque</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Descubra as skins mais raras e cobiçadas da nossa coleção exclusiva
          </p>
        </div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / 4)}%)` }}
            >
              {featuredProducts.map((product) => (
                <div key={product.id} className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0 px-3">
                  <div 
                    className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden hover:border-neon-green/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                      {product.isNew && (
                        <span className="bg-neon-green text-game-dark px-2 py-1 rounded text-xs font-bold">
                          NOVA
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold">
                          DESTAQUE
                        </span>
                      )}
                    </div>

                    {/* Skin Image */}
                    <div className={`h-48 bg-gradient-to-br ${getRarityColor(product.category)} relative overflow-hidden`}>
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded bg-gradient-to-r ${getRarityColor(product.category)} text-white`}>
                          {product.category}
                        </span>
                      </div>
                      
                      <h3 className="text-white font-bold text-lg mb-2 group-hover:text-neon-green transition-colors duration-300">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-neon-green">
                          ${product.price.toFixed(2)}
                        </span>
                        <button className="bg-neon-green text-game-dark px-4 py-2 rounded-lg font-semibold hover:bg-neon-green/90 transition-all duration-300 transform hover:scale-105">
                          Comprar
                        </button>
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neon-green/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-game-dark/80 text-white p-3 rounded-full hover:bg-neon-green hover:text-game-dark transition-all duration-300 border border-neon-green/30"
          >
            ←
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-game-dark/80 text-white p-3 rounded-full hover:bg-neon-green hover:text-game-dark transition-all duration-300 border border-neon-green/30"
          >
            →
          </button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: Math.max(1, featuredProducts.length - 3) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'bg-neon-green' : 'bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkinShowcase;
