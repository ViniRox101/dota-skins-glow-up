import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Importar useParams
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@supabase/supabase-js';

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
  categorias: { nome: string };
  tags_coloridas: { nome: string };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ProductPage = () => {
  const { productName: urlParam } = useParams<{ productName: string }>(); // Obter o parâmetro da URL (nome-do-produto)
  const productName = urlParam ? decodeURIComponent(urlParam.replace(/-/g, ' ')) : undefined; // Extrair o nome do produto da URL, substituir hífens por espaços e decodificar
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {

      try {

        const { data, error } = await supabase
          .from('items')
          .select('*, categorias!items_categoria_id_fkey(nome), tags_coloridas!items_tag_id_fkey(nome)')
          .ilike('nome', productName)
          .single();

        console.log('Supabase data:', data);
        console.log('Supabase error:', error);

        if (error) {
          if (error.code === 'PGRST116') { // Código para "no rows found"
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

  // Se o produto for encontrado, exibir os detalhes
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
                <li>Categoria: {product.categorias.nome}</li>
                <li>Tag: {product.tags_coloridas.nome}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Seção de Produtos Relacionados (Opcional) */}
        {/* Implementação futura: filtrar produtos relacionados */}
        {/* <section className="mt-12">
          <h2 className="text-3xl font-bold text-center mb-8">Produtos Relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 3).map(relatedProduct => (
               <div key={relatedProduct.id} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden hover:border-neon-green/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 cursor-pointer">
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-500 relative overflow-hidden">
                  <img src={relatedProduct.imageUrl} alt={relatedProduct.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">{relatedProduct.name}</h3>
                  <span className="text-xl font-bold text-neon-green">${relatedProduct.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </section> */}
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;