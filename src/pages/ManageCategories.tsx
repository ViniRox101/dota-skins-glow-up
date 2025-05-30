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

const ManageCategories: React.FC = () => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; nome: string }>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddCategory = async () => {
    setErrorMessage(null);
    if (!newCategoryName.trim()) {
      setErrorMessage('O nome da categoria não pode ser vazio.');
      return;
    }

    const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

    console.log('Attempting to add category:');
    console.log('newCategoryName:', newCategoryName);
    console.log('Generated slug:', slug);

    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nome: newCategoryName, slug: slug }])
      .select();

    if (error) {
      console.error('Erro ao adicionar categoria:', error);
      setErrorMessage(`Erro ao adicionar categoria: ${error.message}`);
    } else {
      setCategories([...categories, ...data]);
      setNewCategoryName('');
      setErrorMessage(null); // Changed from '' to null
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      setErrorMessage(`Erro ao buscar categorias: ${error.message}`);
    } else {
      setCategories(data);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir categoria:', error);
      setErrorMessage(`Erro ao excluir categoria: ${error.message}`);
    } else {
      setCategories(categories.filter((category) => category.id !== id));
      setErrorMessage('');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">Gerenciar Categorias</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Adicionar Nova Categoria</h2>
        <div className="flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Nome da Categoria"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-grow bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          <Button
            onClick={handleAddCategory}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded"
          >
            Adicionar Categoria
          </Button>
        </div>
        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-white mb-4">Categorias Existentes</h2>
        {categories.length === 0 ? (
          <p className="text-gray-400">Nenhuma categoria cadastrada.</p>
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
                {categories.map((category) => (
                  <TableRow key={category.id} className="border-t border-gray-600">
                    <TableCell className="px-4 py-2 text-gray-300">{category.id}</TableCell>
                    <TableCell className="px-4 py-2 text-gray-300">{category.nome}</TableCell>
                    <TableCell className="px-4 py-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteCategory(category.id)}
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

export default ManageCategories;