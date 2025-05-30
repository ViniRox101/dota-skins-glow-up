import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createClient } from '@supabase/supabase-js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ManageTags: React.FC = () => {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#FFFFFF');
  const [tags, setTags] = useState<Array<{ id: string; nome: string; cor_hex: string }>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddTag = async () => {
    setErrorMessage(null);
    if (!newTagName.trim()) {
      setErrorMessage('O nome da tag não pode ser vazio.');
      return;
    }

    const { data, error } = await supabase
      .from('tags_coloridas')
      .insert([{ nome: newTagName, cor_hex: newTagColor }])
      .select();

    if (error) {
      console.error('Erro ao adicionar tag:', error);
      setErrorMessage(`Erro ao adicionar tag: ${error.message}`);
    } else {
      setTags([...tags, ...data]);
      setNewTagName('');
      setNewTagColor('#FFFFFF');
      setErrorMessage('');
    }
  };

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('tags_coloridas')
      .select('id, nome, cor_hex');

    if (error) {
      console.error('Erro ao buscar tags:', error);
      setErrorMessage(`Erro ao buscar tags: ${error.message}`);
    } else {
      setTags(data);
    }
  };

  const handleDeleteTag = async (id: string) => {
    const { error } = await supabase
      .from('tags_coloridas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir tag:', error);
      setErrorMessage(`Erro ao excluir tag: ${error.message}`);
    } else {
      setTags(tags.filter((tag) => tag.id !== id));
      setErrorMessage('');
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">Gerenciar Tags</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Adicionar Nova Tag</h2>
        <div className="flex flex-col space-y-4">
          <Input
            type="text"
            placeholder="Nome da Tag"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          <div className="flex items-center space-x-2">
            <label htmlFor="tagColor" className="text-white">Cor da Tag:</label>
            <Input
              type="color"
              id="tagColor"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-24 h-10 p-1 rounded-md border-none cursor-pointer"
              style={{ backgroundColor: newTagColor }}
            />
          </div>
          <Button
            onClick={handleAddTag}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded"
          >
            Adicionar Tag
          </Button>
        </div>
        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-white mb-4">Tags Existentes</h2>
        {tags.length === 0 ? (
          <p className="text-gray-400">Nenhuma tag cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full bg-gray-700 rounded-lg">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-2 text-left text-gray-300">ID</TableHead>
                  <TableHead className="px-4 py-2 text-left text-gray-300">Nome</TableHead>
                  <TableHead className="px-4 py-2 text-left text-gray-300">Cor</TableHead>
                  <TableHead className="px-4 py-2 text-left text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id} className="border-t border-gray-600">
                    <TableCell className="px-4 py-2 text-gray-300">{tag.id}</TableCell>
                    <TableCell className="px-4 py-2 text-gray-300">{tag.nome}</TableCell>
                    <TableCell className="px-4 py-2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-500"
                        style={{ backgroundColor: tag.cor_hex }}
                        title={tag.cor_hex}
                      ></div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteTag(tag.id)}
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

export default ManageTags;