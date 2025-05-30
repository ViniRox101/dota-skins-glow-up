import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria_id: string;
  tag_id: string;
  destaque: boolean;
  imagens: string[];
  created_at: string;
  categorias: { nome: string } | null;
  tags_coloridas: { nome: string } | null;
}

const ProductPage = () => {
  const { productName: urlParam } = useParams<{ productName: string }>();
  const productName = urlParam ? decodeURIComponent(urlParam.replace(/-/g, ' ')) : undefined;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        console.log('Searching for product:', productName);
        
        const { data, error } = await supabase
          .from('items')
          .select(`
            *,
            categorias!items_categoria_id_fkey(nome),
            tags_coloridas!items_tag_id_fkey(nome)
          `)
          .ilike('nome', productName)
          .single();

        console.log('Supabase data:', data);
        console.log('Supabase error:', error);

        if (error) {
          if (error.code === 'PGRST116') {
            setError('Produto não encontrado.');
          } else {
            throw error;
          }
        } else if (data) {
          setProduct(data as Product);
        } else {
          setError('Produto não encontrado.');
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productName) {
      fetchProduct();
    } else {
      setLoading(false);
      setError('Nome do produto inválido na URL.');
    }
  }, [productName]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-game-dark to-gray-900 text-white relative overflow-hidden flex items-center justify-center">
        <Header />
        <div className="text-center relative z-10">
          <h1 className="text-4xl font-bold text-white mb-4">Carregando produto...</h1>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-game-dark to-gray-900 text-white relative overflow-hidden flex items-center justify-center">
        <Header />
        <div className="text-center relative z-10">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Erro ao carregar produto</h1>
          <p className="text-gray-400">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-game-dark to-gray-900 text-white relative overflow-hidden flex items-center justify-center">
        <Header />
        <div className="text-center relative z-10">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Produto não encontrado</h1>
          <p className="text-gray-400">O produto "{productName}" não foi encontrado.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-dark to-gray-900 text-white relative overflow-hidden">
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
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Imagem do Produto */}
          <div className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0">
            <img
              src={product.imagens && product.imagens.length > 0 ? product.imagens[0] : "/placeholder.svg"}
              alt={product.nome}
              className="w-full h-auto rounded-lg shadow-lg object-cover"
            />
          </div>

          {/* Detalhes do Produto */}
          <div className="w-full md:w-1/2 lg:w-2/3">
            <h1 className="text-5xl font-bold text-neon-green mb-4">{product.nome}</h1>
            <p className="text-gray-300 text-lg mb-6">
              {product.descricao}
            </p>
            <div className="flex items-center justify-between mb-6">
              <span className="text-4xl font-bold text-white">R$ {product.preco ? product.preco.toFixed(2) : '0.00'}</span>
              <button className="bg-neon-green text-game-dark px-8 py-3 rounded-lg font-bold text-xl hover:bg-neon-green/90 transition-all duration-300 transform hover:scale-105">
                Comprar Agora
              </button>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Detalhes</h2>
              <ul className="list-disc list-inside text-gray-300">
                <li>Categoria: {product.categorias?.nome || 'Não informado'}</li>
                <li>Tag: {product.tags_coloridas?.nome || 'Não informado'}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;
