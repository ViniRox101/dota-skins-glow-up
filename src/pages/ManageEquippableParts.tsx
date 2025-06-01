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

const ManageEquippableParts: React.FC = () => {
  const [newPartName, setNewPartName] = useState('');
  const [equippableParts, setEquippableParts] = useState<Array<{ id: string; nome: string }>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddPart = async () => {
    setErrorMessage(null);
    if (!newPartName.trim()) {
      setErrorMessage('O nome da parte equipável não pode ser vazio.');
      return;
    }

    const slug = newPartName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

    console.log('Attempting to add equippable part:');
    console.log('newPartName:', newPartName);
    console.log('Generated slug:', slug);

    const { data, error } = await supabase
      .from('partes_equipaveis')
      .insert([{ nome: newPartName, slug: slug }])
      .select();

    if (error) {
      console.error('Erro ao adicionar parte equipável:', error);
      setErrorMessage(`Erro ao adicionar parte equipável: ${error.message}`);
    } else {
      setEquippableParts([...equippableParts, ...data]);
      setNewPartName('');
      setErrorMessage(null);
    }
  };

  const fetchEquippableParts = async () => {
    const { data, error } = await supabase
      .from('partes_equipaveis')
      .select('id, nome');

    if (error) {
      console.error('Erro ao buscar partes equipáveis:', error);
      setErrorMessage(`Erro ao buscar partes equipáveis: ${error.message}`);
    } else {
      setEquippableParts(data);
    }
  };

  const handleDeletePart = async (id: string) => {
    const { error } = await supabase
      .from('partes_equipaveis')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir parte equipável:', error);
      setErrorMessage(`Erro ao excluir parte equipável: ${error.message}`);
    } else {
      setEquippableParts(equippableParts.filter((part) => part.id !== id));
      setErrorMessage('');
    }
  };

  useEffect(() => {
    fetchEquippableParts();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">Gerenciar Partes Equipáveis</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Adicionar Nova Parte Equipável</h2>
        <div className="flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Nome da Parte Equipável"
            value={newPartName}
            onChange={(e) => setNewPartName(e.target.value)}
            className="flex-grow bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          <Button
            onClick={handleAddPart}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded"
          >
            Adicionar Parte Equipável
          </Button>
        </div>
        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-white mb-4">Partes Equipáveis Existentes</h2>
        {equippableParts.length === 0 ? (
          <p className="text-gray-400">Nenhuma parte equipável cadastrada.</p>
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
                {equippableParts.map((part) => (
                  <TableRow key={part.id} className="border-t border-gray-600">
                    <TableCell className="px-4 py-2 text-gray-300">{part.id}</TableCell>
                    <TableCell className="px-4 py-2 text-gray-300">{part.nome}</TableCell>
                    <TableCell className="px-4 py-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletePart(part.id)}
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

export default ManageEquippableParts;