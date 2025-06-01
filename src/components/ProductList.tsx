
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
  categoria_id: string;
  categorias: { nome: string } | null;
  raridade_id: string;
  raridades: { nome: string } | null;
  destaque: boolean;
  imagens: string[];
  created_at: string;
  mega_destaque: boolean;
  heroi_id: string | null; // Adiciona o relacionamento com heróis
  herois: { nome: string } | null;
  desconto_porcentagem: number | null; // Adiciona a porcentagem de desconto
}

interface ProductListProps {
  limit?: number;
  isFeaturedOnly?: boolean;
  isMegaFeaturedOnly?: boolean; // Nova prop para filtrar mega destaque
  filters?: { // Nova prop para encapsular todos os filtros
    categories: string[];
    rarities: string[];
    heroes: string[];
    price: [number, number];
  };
  noGrid?: boolean; // Nova prop para desativar o grid interno
}

const ProductList: React.FC<ProductListProps> = ({ limit, isFeaturedOnly, isMegaFeaturedOnly, filters, noGrid }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getRarityColor = (rarityName: string) => {
    const colors: { [key: string]: string } = {
      'Arcana': 'from-red-500 to-orange-500',
      'Immortal': 'from-yellow-400 to-orange-500',
      'Legendary': 'from-purple-500 to-pink-500',
      'Mythical': 'from-purple-400 to-blue-500',
      'Divine': 'from-cyan-400 to-blue-500',
      'Cosmic': 'from-green-400 to-cyan-500',
      'Manopla': 'from-red-500 to-orange-500',
      'Capa': 'from-purple-400 to-blue-500',
      'Espada': 'from-yellow-400 to-orange-500',
      'Gancho': 'from-green-400 to-cyan-500',
    };
    return colors[rarityName] || 'from-gray-400 to-gray-600';
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Fetching products with filters:', { filters });
        
        let query = supabase.from('items').select(`
          id, nome, descricao, preco, categoria_id, destaque, imagens, created_at, mega_destaque, desconto_porcentagem,
          heroi_id,
          categorias:categorias!items_categoria_id_fkey(nome),
          raridades:raridades!items_raridade_id_fkey(nome),
          herois:herois!items_heroi_id_fkey(nome)
        `);

        if (isFeaturedOnly) {
          query = query.eq('destaque', true);
        }

        // Adiciona filtro para mega_destaque se a prop for passada
        if (isMegaFeaturedOnly) {
          query = query.eq('mega_destaque', true);
        }

        if (limit) {
          query = query.limit(limit);
        }

        if (filters) {
          if (filters.categories && filters.categories.length > 0) {
            query = query.in('categoria_id', filters.categories);
          }

          if (filters.rarities && filters.rarities.length > 0) {
            query = query.in('raridade_id', filters.rarities);
          }

          if (filters.heroes && filters.heroes.length > 0) {
            query = query.in('heroi_id', filters.heroes);
          }

          if (filters.price) {
            query = query.gte('preco', filters.price[0]).lte('preco', filters.price[1]);
          }
        }

        const { data, error } = await query;

        console.log('ProductList - Supabase data:', data);
        console.log('ProductList - Supabase error:', error);

        if (error) {
          throw error;
        }

        const typedData: Product[] = data ? data.map((item: any) => ({
          id: item.id,
          nome: item.nome,
          descricao: item.descricao,
          preco: item.preco,
          categoria_id: item.categoria_id,
          categorias: item.categorias,
          raridade_id: item.raridade_id,
          raridades: item.raridades,
          destaque: item.destaque,
          imagens: item.imagens || [],
          created_at: item.created_at,
          mega_destaque: item.mega_destaque,
          heroi_id: item.heroi_id,
          herois: item.herois,
          desconto_porcentagem: item.desconto_porcentagem,
        })) : [];

        setProducts(typedData);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit, isFeaturedOnly, filters]);

  if (loading) {
    return <div className="text-white text-center">Carregando produtos...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Erro ao carregar produtos: {error}</div>;
  }

  if (products.length === 0) {
    return <div className="text-gray-400 text-center">Nenhum produto encontrado.</div>;
  }

  return noGrid ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden hover:border-neon-green/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 cursor-pointer flex flex-col"
          onClick={() => navigate(`/products/${encodeURIComponent(product.nome.toLowerCase().replace(/ /g, '-'))}`)}
        >
          {/* Skin Image */}
          <div className="relative w-full aspect-square bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
            <img src={product.imagens && product.imagens.length > 0 ? product.imagens[0] : "/placeholder.svg"} alt={product.nome} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute inset-0 bg-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-grow justify-between">
            <div>
              {/* Tags de Raridade e Categoria */}
              <div className="flex flex-wrap gap-1 mb-1">
                {product.raridades && (
                  <span className={`text-xs font-bold px-2 py-1 rounded text-white bg-gradient-to-r ${getRarityColor(product.raridades.nome)}`}>
                    {product.raridades.nome || 'N/A'}
                  </span>
                )}
                {product.categorias && (
                  <span className={`text-xs font-bold px-2 py-1 rounded text-white bg-gradient-to-r ${getRarityColor(product.categorias.nome)}`}>
                    {product.categorias.nome || 'N/A'}
                  </span>
                )}
              </div>

              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-neon-green transition-colors duration-300">
                {product.nome}
              </h3>
            </div>

            <div className="flex items-center justify-between flex-wrap mt-auto">
              {product.desconto_porcentagem !== null && product.desconto_porcentagem > 0 ? (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400 line-through">
                    R$ {product.preco ? product.preco.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-xl font-bold text-neon-green">
                    R$ {(product.preco * (1 - product.desconto_porcentagem / 100)).toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-xl font-bold text-white">
                  R$ {product.preco ? product.preco.toFixed(2) : '0.00'}
                </span>
              )}
              <BuyModal whatsappLink="https://wa.me/5511999999999">
                <Button className="bg-neon-green text-black hover:bg-neon-green/80 transition-colors duration-300">
                  Comprar
                </Button>
              </BuyModal>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden hover:border-neon-green/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 cursor-pointer flex flex-col"
          onClick={() => navigate(`/products/${encodeURIComponent(product.nome.toLowerCase().replace(/ /g, '-'))}`)}
        >
          {/* Skin Image */}
          <div className="relative w-full aspect-square bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
            <img src={product.imagens && product.imagens.length > 0 ? product.imagens[0] : "/placeholder.svg"} alt={product.nome} className="w-full h-full object-cover" />
            {/* <div className="absolute inset-0 bg-black/20" /> */}
            {/* <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" /> */}
            <div className="absolute inset-0 bg-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-grow justify-between">
            <div>
              {/* Tags de Raridade e Categoria */}
              <div className="flex flex-wrap gap-1 mb-1">
                {product.raridades && (
                  <span className={`text-xs font-bold px-2 py-1 rounded text-white bg-gradient-to-r ${getRarityColor(product.raridades.nome)}`}>
                    {product.raridades.nome || 'N/A'}
                  </span>
                )}
                {product.categorias && (
                  <span className={`text-xs font-bold px-2 py-1 rounded text-white bg-gradient-to-r ${getRarityColor(product.categorias.nome)}`}>
                    {product.categorias.nome || 'N/A'}
                  </span>
                )}
              </div>

              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-neon-green transition-colors duration-300">
                {product.nome}
              </h3>
            </div>

            <div className="flex items-center justify-between flex-wrap mt-auto">
              {product.desconto_porcentagem !== null && product.desconto_porcentagem > 0 ? (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400 line-through">
                    R$ {product.preco ? product.preco.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-xl font-bold text-neon-green">
                    R$ {(product.preco * (1 - product.desconto_porcentagem / 100)).toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-xl font-bold text-white">
                  R$ {product.preco ? product.preco.toFixed(2) : '0.00'}
                </span>
              )}
              <BuyModal whatsappLink="https://wa.me/5511999999999">
                <Button className="bg-neon-green text-black hover:bg-neon-green/80 transition-colors duration-300">
                  Comprar
                </Button>
              </BuyModal>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
