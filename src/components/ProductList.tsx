
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria_id: string;
  categorias: { nome: string } | null;
  tag_id: string;
  tags_coloridas: { nome: string } | null;
  destaque: boolean;
  imagens: string[];
  created_at: string;
}

interface ProductListProps {
  limit?: number;
  isFeaturedOnly?: boolean;
  selectedCategories?: string[];
  selectedTags?: string[];
  priceRange?: [number, number];
}

const ProductList: React.FC<ProductListProps> = ({ limit, isFeaturedOnly, selectedCategories, selectedTags, priceRange }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Fetching products with filters:', { selectedCategories, selectedTags, priceRange });
        
        let query = supabase.from('items').select(`
          *,
          categorias!items_categoria_id_fkey(nome),
          tags_coloridas!items_tag_id_fkey(nome)
        `);

        if (isFeaturedOnly) {
          query = query.eq('destaque', true);
        }

        if (limit) {
          query = query.limit(limit);
        }

        if (selectedCategories && selectedCategories.length > 0) {
          query = query.in('categoria_id', selectedCategories);
        }

        if (selectedTags && selectedTags.length > 0) {
          query = query.in('tag_id', selectedTags);
        }

        if (priceRange) {
          query = query.gte('preco', priceRange[0]).lte('preco', priceRange[1]);
        }

        const { data, error } = await query;

        console.log('ProductList - Supabase data:', data);
        console.log('ProductList - Supabase error:', error);

        if (error) {
          throw error;
        }

        setProducts(data || []);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit, isFeaturedOnly, selectedCategories, selectedTags, priceRange]);

  if (loading) {
    return <div className="text-white text-center">Carregando produtos...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Erro ao carregar produtos: {error}</div>;
  }

  if (products.length === 0) {
    return <div className="text-gray-400 text-center">Nenhum produto encontrado.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
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
          <div className="h-48 bg-gradient-to-br from-red-500 to-orange-500 relative overflow-hidden">
            <img src={product.imagens && product.imagens.length > 0 ? product.imagens[0] : "/placeholder.svg"} alt={product.nome} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute inset-0 bg-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-2">
              <span className="text-xs font-bold px-2 py-1 rounded bg-gradient-to-r from-red-500 to-orange-500 text-white">
                {product.categorias ? product.categorias.nome : 'N/A'}
              </span>
            </div>

            {product.tags_coloridas && (
              <div className="mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded bg-gradient-to-r from-red-500 to-orange-500 text-white">
                  {product.tags_coloridas.nome}
                </span>
              </div>
            )}

            <h3 className="text-white font-bold text-lg mb-2 group-hover:text-neon-green transition-colors duration-300">
              {product.nome}
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-neon-green">
                R$ {product.preco ? product.preco.toFixed(2) : '0.00'}
              </span>
              <button className="bg-neon-green text-game-dark px-4 py-2 rounded-lg font-semibold hover:bg-neon-green/90 transition-all duration-300 transform hover:scale-105">
                Comprar
              </button>
            </div>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neon-green/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      ))}
    </div>
  );
};

export default ProductList;
