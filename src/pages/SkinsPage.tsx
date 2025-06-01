import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductList from '@/components/ProductList'; // Importar o novo componente ProductList
import { createClient } from '@supabase/supabase-js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SkinsPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [categories, setCategories] = useState<any[]>([]);
  const [rarities, setRarities] = useState<any[]>([]);
  const [heroes, setHeroes] = useState<any[]>([]); // Novo estado para heróis
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedHeroes, setSelectedHeroes] = useState<string[]>([]); // Novo estado para heróis selecionados
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);

  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [appliedFilters, setAppliedFilters] = useState({
    categories: [] as string[],
    rarities: [] as string[],
    heroes: [] as string[], // Novo filtro para heróis
    price: [0, 500] as [number, number],
  });

  useEffect(() => {
    setAppliedFilters({
      categories: selectedCategories,
      rarities: selectedRarities,
      heroes: selectedHeroes,
      price: priceRange,
    });
  }, [selectedCategories, selectedRarities, selectedHeroes, priceRange]);

  useEffect(() => {
    const fetchFilters = async () => {
      const { data: categoriesData, error: categoriesError } = await supabase.from('categorias').select('id, nome');
      if (categoriesData) {
        setCategories(categoriesData.sort((a, b) => a.nome.localeCompare(b.nome)));
      }
      if (categoriesError) {
        console.error('Erro ao buscar categorias:', categoriesError);
      }

      const { data: raritiesData, error: raritiesError } = await supabase.from('raridades').select('id, nome');
      if (raritiesData) {
        setRarities(raritiesData.sort((a, b) => a.nome.localeCompare(b.nome)));
      }
      if (raritiesError) {
        console.error('Erro ao buscar raridades:', raritiesError);
      }

      const { data: heroesData, error: heroesError } = await supabase.from('herois').select('id, nome');
      if (heroesData) {
        setHeroes(heroesData.sort((a, b) => a.nome.localeCompare(b.nome)));
      }
      if (heroesError) {
        console.error('Erro ao buscar heróis:', heroesError);
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
            <button
              onClick={() => {
                setSelectedCategories([]);
                setSelectedRarities([]);
                setSelectedHeroes([]);
                setPriceRange([0, 500]);
                setAppliedFilters({
                  categories: [],
                  rarities: [],
                  heroes: [],
                  price: [0, 500],
                });
              }}
              className="mb-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              Limpar Filtros
            </button>
            {/* Categoria */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Baús</h3>
              <Select
                onValueChange={(value) =>
                  setSelectedCategories(value ? [value] : [])
                }
                value={selectedCategories[0] || ''}
              >
                <SelectTrigger className="w-full bg-gray-700 text-white border border-gray-600 hover:border-neon-green transition-colors duration-300">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 text-white border border-gray-600">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Raridades */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Raridade</h3>
              <Select
                onValueChange={(value) =>
                  setSelectedRarities(value ? [value] : [])
                }
                value={selectedRarities[0] || ''}
              >
                <SelectTrigger className="w-full bg-gray-700 text-white border border-gray-600 hover:border-neon-green transition-colors duration-300">
                  <SelectValue placeholder="Selecione uma raridade" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 text-white border border-gray-600">
                  {rarities.map((rarity) => (
                    <SelectItem key={rarity.id} value={rarity.id}>
                      {rarity.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heróis */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Herói</h3>
              <Select
                onValueChange={(value) =>
                  setSelectedHeroes(value ? [value] : [])
                }
                value={selectedHeroes[0] || ''}
              >
                <SelectTrigger className="w-full bg-gray-700 text-white border border-gray-600 hover:border-neon-green transition-colors duration-300">
                  <SelectValue placeholder="Selecione um herói" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 text-white border border-gray-600">
                  {heroes.map((hero) => (
                    <SelectItem key={hero.id} value={hero.id}>
                      {hero.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Valor</h3>
              <Slider
                min={0}
                max={500}
                step={1}
                value={[priceRange[1]]}
                onValueChange={(value: number[]) => setPriceRange([0, value[0]])}
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-2">
                <span>R$ {priceRange[0].toFixed(2)}</span>
                <span>R$ {priceRange[1].toFixed(2)}{priceRange[1] === 500 ? '+' : ''}</span>
              </div>
            </div>

            {/* <button
              onClick={handleApplyFilters}
              className="w-full bg-neon-green hover:bg-green-600 text-gray-900 font-bold py-2 px-4 rounded transition duration-300"
            >
              Aplicar Filtros
            </button> */}
          </div>
        </aside>

        {/* Lista de Produtos */}
        <section className="w-full md:w-3/4">
          <h1 className="text-4xl font-bold text-center w-full mb-8 hidden md:block">Todas as Skins</h1>
          <ProductList filters={appliedFilters} />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SkinsPage;