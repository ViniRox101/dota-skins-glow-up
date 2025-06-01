import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BuyModal } from './ui/BuyModal'; // Importa o BuyModal
import { Button } from './ui/button'; // Importa o Button

interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  desconto_porcentagem?: number;
  categoria_id: string;
  categorias: { nome: string } | null;
  raridade_id: string;
  raridades: { nome: string } | null;
  destaque: boolean;
  imagens: string[];
  created_at: string;
}

const FeaturedProductCarousel: React.FC = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(4);
      } else if (window.innerWidth >= 640) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(1);
      }
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        console.log('Fetching featured products...');
        
        const { data, error } = await supabase
          .from('items')
          .select(`
            *,
            categorias!items_categoria_id_fkey(nome),
            raridades!items_raridade_id_fkey(nome),
            desconto_porcentagem
          `)
          .eq('destaque', true);

        console.log('FeaturedCarousel - Supabase data:', data);
        console.log('FeaturedCarousel - Supabase error:', error);

        if (error) {
          throw error;
        }

        setFeaturedProducts(data || []);
      } catch (err: any) {
        console.error('Error fetching featured products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, featuredProducts.length - itemsPerPage + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, featuredProducts.length - itemsPerPage + 1)) % Math.max(1, featuredProducts.length - itemsPerPage + 1));
  };

  const getRarityColor = (rarityName: string) => {
    const colors: { [key: string]: string } = {
      'Comum': 'from-gray-400 to-gray-600',
      'Incomum': 'from-green-500 to-green-700',
      'Rara': 'from-blue-500 to-blue-700',
      'Mítica': 'from-purple-500 to-purple-700',
      'Lendária': 'from-orange-500 to-orange-700',
      'Antiga': 'from-red-500 to-red-700',
      'Imortal': 'from-yellow-500 to-yellow-700',
      'Arcana': 'from-pink-500 to-purple-500',
    };
    return colors[rarityName] || 'from-gray-400 to-gray-600';
  };

  if (loading) {
    return <div className="text-white text-center">Carregando produtos em destaque...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Erro ao carregar produtos em destaque: {error}</div>;
  }

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section id="featured-products-carousel" className="py-20 bg-gradient-to-b from-game-dark to-gray-900 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            <span className="text-neon-green">Produtos em Destaque</span>
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
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
            >
              {featuredProducts.map((product) => (
                <div key={product.id} className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0 px-3 mb-6">
                  <div 
                    className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden hover:border-neon-green/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 cursor-pointer"
                    onClick={() => navigate(`/products/${encodeURIComponent(product.nome.toLowerCase().replace(/ /g, '-'))}`)}
                  >
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                      {product.destaque && (
                        <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold">
                          DESTAQUE
                        </span>
                      )}
                      {new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                        <span className="bg-neon-green text-game-dark px-2 py-1 rounded text-xs font-bold">
                          NOVA
                        </span>
                      )}
                    </div>

                    {/* Skin Image */}
                    <div className={`h-48 bg-gradient-to-br ${getRarityColor(product.categorias?.nome || '')} relative overflow-hidden`}>
                      <img src={product.imagens && product.imagens.length > 0 ? product.imagens[0] : "/placeholder.svg"} alt={product.nome} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded bg-gradient-to-r ${getRarityColor(product.categorias?.nome || '')} text-white`}>
                          {product.categorias?.nome || 'N/A'}
                        </span>
                      </div>
                      
                      {product.raridades && (
                        <div className="mb-2">
                          <span className="text-xs font-bold px-2 py-1 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            {product.raridades?.nome || 'N/A'}
                          </span>
                        </div>
                      )}

                      <h3 className="text-white font-bold text-lg mb-2 group-hover:text-neon-green transition-colors duration-300">
                        {product.nome}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        {product.desconto_porcentagem && product.desconto_porcentagem > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-xl text-gray-400 line-through">
                              R$ {product.preco.toFixed(2)}
                            </span>
                            <span className="text-2xl font-bold text-neon-green">
                              R$ {(product.preco * (1 - product.desconto_porcentagem / 100)).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-neon-green">
                            R$ {product.preco ? product.preco.toFixed(2) : '0.00'}
                          </span>
                        )}
                        <BuyModal whatsappLink="https://wa.link/196mnu">
                          <Button className="bg-neon-green text-game-dark px-4 py-2 rounded-lg font-semibold hover:bg-neon-green/90 transition-all duration-300">
                            Comprar
                          </Button>
                        </BuyModal>
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
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-game-dark/80 text-white p-3 rounded-full hover:bg-neon-green hover:text-game-dark transition-all duration-300 border border-neon-green/30"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductCarousel;
