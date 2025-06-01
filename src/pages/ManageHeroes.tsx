import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ManageHeroes: React.FC = () => {
  const [newHeroName, setNewHeroName] = useState('');
  const [heroes, setHeroes] = useState<Array<{ id: string; nome: string }>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddHero = async () => {
    setErrorMessage(null);
    if (!newHeroName.trim()) {
      setErrorMessage('O nome do herói não pode ser vazio.');
      return;
    }

    const slug = newHeroName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

    console.log('Attempting to add hero:');
    console.log('newHeroName:', newHeroName);
    console.log('Generated slug:', slug);

    const { data, error } = await supabase
      .from('herois')
      .insert([{ nome: newHeroName, slug: slug }])
      .select();

    if (error) {
      console.error('Erro ao adicionar herói:', error);
      setErrorMessage(`Erro ao adicionar herói: ${error.message}`);
    } else {
      setHeroes([...heroes, ...data]);
      setNewHeroName('');
      setErrorMessage(null); 
    }
  };

  const fetchHeroes = async () => {
    const { data, error } = await supabase
      .from('herois')
      .select('id, nome');

    if (error) {
      console.error('Erro ao buscar heróis:', error);
      setErrorMessage(`Erro ao buscar heróis: ${error.message}`);
    } else {
      setHeroes(data);
    }
  };

  const handleDeleteHero = async (id: string) => {
    const { error } = await supabase
      .from('herois')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir herói:', error);
      setErrorMessage(`Erro ao excluir herói: ${error.message}`);
    } else {
      setHeroes(heroes.filter((hero) => hero.id !== id));
      setErrorMessage('');
    }
  };

  useEffect(() => {
    fetchHeroes();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">Gerenciar Heróis</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Adicionar Novo Herói</h2>
        <div className="flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Nome do Herói"
            value={newHeroName}
            onChange={(e) => setNewHeroName(e.target.value)}
            className="flex-grow bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          <Button
            onClick={handleAddHero}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded"
          >
            Adicionar Herói
          </Button>
        </div>
        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-white mb-4">Heróis Existentes</h2>
        {heroes.length === 0 ? (
          <p className="text-gray-400">Nenhum herói cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full bg-gray-700 rounded-lg">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-2 text-left text-gray-300">ID</TableHead>
                  <TableHead className="px-4 py-2 text-left text-gray-300">Nome</TableHead>
                  <TableHead className="px-4 py-2 text-left text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heroes.map((hero) => (
                  <TableRow key={hero.id} className="border-t border-gray-600">
                    <TableCell className="px-4 py-2 text-gray-300">{hero.id}</TableCell>
                    <TableCell className="px-4 py-2 text-gray-300">{hero.nome}</TableCell>
                    <TableCell className="px-4 py-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteHero(hero.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageHeroes;