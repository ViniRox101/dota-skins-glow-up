import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

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
}

interface Category {
  id: string;
  nome: string;
}

interface Tag {
  id: string;
  nome: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ManageProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchTags();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('items').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error("Erro ao carregar produtos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categorias').select('*');
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar categorias: " + err.message);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase.from('tags_coloridas').select('*');
      if (error) throw error;
      setTags(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar tags: " + err.message);
    }
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct({ ...product });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const { error } = await supabase.from('items').delete().eq('id', id);
        if (error) throw error;
        toast.success('Produto excluído com sucesso!');
        fetchProducts();
      } catch (err: any) {
        toast.error('Erro ao excluir produto: ' + err.message);
      }
    }
  };

  const handleSave = async () => {
    if (!currentProduct) return;

    try {
      const { error } = await supabase.from('items').update(currentProduct).eq('id', currentProduct.id);
      if (error) throw error;
      toast.success('Produto atualizado com sucesso!');
      setIsEditDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error('Erro ao atualizar produto: ' + err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCurrentProduct(prev => prev ? { ...prev, [name]: checked } : null);
  };

  if (loading) {
    return <div className="text-white text-center">Carregando produtos...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Erro: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-neon-green mb-6">Gerenciar Produtos</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-game-dark rounded-lg shadow-lg">
          <thead>
            <tr className="bg-neon-green/20 text-neon-green uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Nome</th>
              <th className="py-3 px-6 text-left">Preço</th>
              <th className="py-3 px-6 text-left">Categoria</th>
              <th className="py-3 px-6 text-left">Tag</th>
              <th className="py-3 px-6 text-left">Destaque</th>
              <th className="py-3 px-6 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-gray-300 text-sm font-light">
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-700 hover:bg-neon-green/10">
                <td className="py-3 px-6 text-left whitespace-nowrap">{product.nome}</td>
                <td className="py-3 px-6 text-left">R$ {product.preco.toFixed(2)}</td>
                <td className="py-3 px-6 text-left">{categories.find(cat => cat.id === product.categoria_id)?.nome || 'N/A'}</td>
                <td className="py-3 px-6 text-left">{tags.find(tag => tag.id === product.tag_id)?.nome || 'N/A'}</td>
                <td className="py-3 px-6 text-left">{product.destaque ? 'Sim' : 'Não'}</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} className="mr-2 text-blue-400 hover:text-blue-600">Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-600">Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-game-dark text-white border border-neon-green/20">
          <DialogHeader>
            <DialogTitle className="text-neon-green">Editar Produto</DialogTitle>
          </DialogHeader>
          {currentProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">Nome</Label>
                <Input id="nome" name="nome" value={currentProduct.nome} onChange={handleChange} className="col-span-3 bg-gray-800 border-gray-700 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descricao" className="text-right">Descrição</Label>
                <Textarea id="descricao" name="descricao" value={currentProduct.descricao} onChange={handleChange} className="col-span-3 bg-gray-800 border-gray-700 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="preco" className="text-right">Preço</Label>
                <Input id="preco" name="preco" type="number" value={currentProduct.preco} onChange={handleChange} className="col-span-3 bg-gray-800 border-gray-700 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoria_id" className="text-right">Categoria</Label>
                <select id="categoria_id" name="categoria_id" value={currentProduct.categoria_id} onChange={handleChange} className="col-span-3 bg-gray-800 border-gray-700 text-white p-2 rounded-md">
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tag_id" className="text-right">Tag</Label>
                <select id="tag_id" name="tag_id" value={currentProduct.tag_id} onChange={handleChange} className="col-span-3 bg-gray-800 border-gray-700 text-white p-2 rounded-md">
                  {tags.map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.nome}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="destaque" className="text-right">Destaque</Label>
                <Checkbox id="destaque" name="destaque" checked={currentProduct.destaque} onCheckedChange={(checked) => setCurrentProduct(prev => prev ? { ...prev, destaque: checked as boolean } : null)} className="col-span-3" />
              </div>
              {/* Imagens - simplificado, pode ser mais complexo com upload */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imagens" className="text-right">Imagens (URLs)</Label>
                <Textarea id="imagens" name="imagens" value={currentProduct.imagens.join('\n')} onChange={(e) => setCurrentProduct(prev => prev ? { ...prev, imagens: e.target.value.split('\n') } : null)} className="col-span-3 bg-gray-800 border-gray-700 text-white" placeholder="Uma URL por linha" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleSave} className="bg-neon-green text-game-dark hover:bg-neon-green/90">Salvar mudanças</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageProducts;