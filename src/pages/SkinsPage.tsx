import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductList from '@/components/ProductList'; // Importar o novo componente ProductList
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SkinsPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);

  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [appliedFilters, setAppliedFilters] = useState({
    categories: [] as string[],
    tags: [] as string[],
    price: [0, 500] as [number, number],
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      categories: selectedCategories,
      tags: selectedTags,
      price: priceRange,
    });
  };

  useEffect(() => {
    const fetchFilters = async () => {
      const { data: categoriesData, error: categoriesError } = await supabase.from('categorias').select('id, nome');
      if (categoriesData) {
        setCategories(categoriesData);
      }
      if (categoriesError) {
        console.error('Erro ao buscar categorias:', categoriesError);
      }

      const { data: tagsData, error: tagsError } = await supabase.from('tags_coloridas').select('id, nome');
      if (tagsData) {
        setTags(tagsData);
      }
      if (tagsError) {
        console.error('Erro ao buscar tags:', tagsError);
      }
    };

    fetchFilters();
  }, []);

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

  // const newItems = products.filter(product => product.isNew).slice(0, 4);
  // const allItems = products;

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
      <main className="container mx-auto px-4 py-8 pt-24 flex flex-col md:flex-row relative z-10">
        <h1 className="text-4xl font-bold text-center w-full mb-8 md:hidden">Todas as Skins</h1>
        {/* Sidebar de Filtros */}
        <aside className="w-full md:w-1/4 pr-8 mb-8 md:mb-0">
          <div className="bg-gray-800/50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Filtros</h2>
            {/* Categoria */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Categoria</h3>
              {/* Checkboxes ou Radio buttons para categorias */}
              {categories.map(category => (
                <label key={category.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="form-checkbox text-neon-green rounded"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => {
                      setSelectedCategories(prev =>
                        prev.includes(category.id)
                          ? prev.filter(id => id !== category.id)
                          : [...prev, category.id]
                      );
                    }}
                  />
                  <span className="ml-2">{category.nome}</span>
                </label>
              ))}
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              {tags.map(tag => (
                <label key={tag.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="form-checkbox text-neon-green rounded"
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  />
                  <span className="ml-2">{tag.nome}</span>
                </label>
              ))}
            </div>

            {/* Valor */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Valor</h3>
              {/* Slider ou input range para valor */}
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-2">
                <span>R$ {priceRange[0].toFixed(2)}</span>
                <span>R$ {priceRange[1].toFixed(2)}+</span>
              </div>
            </div>

            {/* Botão de Aplicar Filtros */}
            <button
              className="w-full bg-neon-green text-game-dark py-2 rounded-lg font-semibold hover:bg-neon-green/90 transition-all duration-300"
              onClick={handleApplyFilters}
            >
              Aplicar Filtros
            </button>
          </div>
        </aside>

        {/* Grid de Produtos */}
        <section className="w-full md:w-3/4">
          {/* Todos os Itens */}
          <div>
            <h2 className="text-3xl font-bold mb-6 text-neon-green">Todos os Itens</h2>
            <ProductList
            selectedCategories={selectedCategories}
            selectedTags={selectedTags}
            priceRange={priceRange}
          /> {/* Exibir todos os produtos com filtros */}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SkinsPage;