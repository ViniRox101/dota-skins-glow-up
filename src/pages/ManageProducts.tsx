import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria_id: string;
  raridade_id: string;
  destaque: boolean;
  imagens: string[];
  created_at: string;
  mega_destaque: boolean; // Adiciona o campo mega_destaque
  desconto_porcentagem: number | null; // Adiciona a porcentagem de desconto
  estoque: number; // Adiciona o campo de estoque
  heroi_id: string; // Adiciona o campo de heroi_id
  herois: { nome: string } | null; // Adiciona o campo de herois para o nome
}

interface Category {
  id: string;
  nome: string;
}

interface Rarity {
  id: string;
  nome: string;
}

interface Hero {
  id: string;
  nome: string;
}



const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ManageProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchRarities();
    fetchHeroes();
  }, [sortColumn, sortDirection]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('items').select('*, herois(nome)');

      if (sortColumn) {
        query = query.order(sortColumn === 'herois' ? 'herois(nome)' : sortColumn, { ascending: sortDirection === 'asc' });
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error("Erro ao carregar produtos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
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

  const fetchRarities = async () => {
    try {
      const { data, error } = await supabase.from('raridades').select('*');
      if (data) {
        setRarities(data);
      }
      if (error) {
        console.error('Erro ao buscar raridades:', error);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar raridades: " + err.message);
    }
  };

  const fetchHeroes = async () => {
    try {
      const { data, error } = await supabase.from('herois').select('*');
      if (data) {
        setHeroes(data);
      }
      if (error) {
        console.error('Erro ao buscar heróis:', error);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar heróis: " + err.message);
    }
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDeleteId(productId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDeleteId) return;
    try {
      const { error } = await supabase.from('items').delete().eq('id', productToDeleteId);
      if (error) throw error;
      toast.success("Produto excluído com sucesso!");
      fetchProducts();
    } catch (err: any) {
      toast.error("Erro ao excluir produto: " + err.message);
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDeleteId(null);
    }
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleChange = async (product: Product, field: keyof Product, value: any) => {
    try {
      const { error } = await supabase.from('items').update({ [field]: value }).eq('id', product.id);
      if (error) throw error;
      toast.success("Produto atualizado com sucesso!");
      fetchProducts(); // Recarrega os produtos para refletir a mudança
    } catch (err: any) {
      toast.error("Erro ao atualizar produto: " + err.message);
    }
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
              <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('nome')}>
                <div className="flex items-center">
                  Nome {sortColumn === 'nome' ? (sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />) : <ArrowUpDown className="ml-1 h-4 w-4" />}
                </div>
              </th>
              <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('preco')}>
                <div className="flex items-center">
                  Preço {sortColumn === 'preco' ? (sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />) : <ArrowUpDown className="ml-1 h-4 w-4" />}
                </div>
              
              </th>
              <th className="py-3 px-6 text-left">Desconto</th>
              <th className="py-3 px-6 text-left">Estoque</th>
              <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('herois')}>
                <div className="flex items-center">
                  Herói {sortColumn === 'herois' ? (sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />) : <ArrowUpDown className="ml-1 h-4 w-4" />}
                </div>
              </th>
              <th className="py-3 px-6 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-gray-300 text-sm font-light">
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-700 hover:bg-neon-green/10">
                <td className="py-3 px-6 text-left whitespace-nowrap">{product.nome}</td>
                <td className="py-3 px-6 text-left">R$ {product.preco.toFixed(2)}</td>
                <td className="py-3 px-6 text-left">
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={() => handleChange(product, 'desconto_porcentagem', (product.desconto_porcentagem || 0) - 5)}>-</Button>
                    <span>{product.desconto_porcentagem || 0}%</span>
                    <Button variant="ghost" size="sm" onClick={() => handleChange(product, 'desconto_porcentagem', (product.desconto_porcentagem || 0) + 5)}>+</Button>
                  </div>
                </td>
                <td className="py-3 px-6 text-left">
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={() => handleChange(product, 'estoque', (product.estoque || 0) - 1)}>-</Button>
                    <span>{product.estoque || 0}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleChange(product, 'estoque', (product.estoque || 0) + 1)}>+</Button>
                  </div>
                </td>
                <td className="py-3 px-6 text-left">{product.herois?.nome || 'N/A'}</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center">
                  <Button className="mr-2 bg-green-500 text-black hover:bg-black hover:text-green-500" onClick={() => handleEdit(product)}>
                    Editar
                  </Button>
                  <Button className="bg-red-500 text-black hover:bg-black hover:text-red-500" onClick={() => handleDeleteClick(product.id)}>
                    Excluir
                  </Button>
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
                <Input id="nome" name="nome" value={currentProduct.nome} onChange={(e) => setCurrentProduct(prev => prev ? { ...prev, nome: e.target.value } : null)} className="col-span-3 bg-gray-800 border-gray-700 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descricao" className="text-right">Descrição</Label>
                <Textarea id="descricao" name="descricao" value={currentProduct.descricao} onChange={(e) => setCurrentProduct(prev => prev ? { ...prev, descricao: e.target.value } : null)} className="col-span-3 bg-gray-800 border-gray-700 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="preco" className="text-right">Preço</Label>
                <Input id="preco" name="preco" type="number" value={currentProduct.preco} onChange={(e) => setCurrentProduct(prev => prev ? { ...prev, preco: parseFloat(e.target.value) } : null)} className="col-span-3 bg-gray-700 text-white border-gray-600" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desconto_porcentagem" className="text-right">Desconto (%)</Label>
                <Input id="desconto_porcentagem" name="desconto_porcentagem" type="number" value={currentProduct?.desconto_porcentagem ?? ''} onChange={(e) => setCurrentProduct(prev => prev ? { ...prev, desconto_porcentagem: parseFloat(e.target.value) } : null)} className="col-span-3 bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estoque" className="text-right">Estoque</Label>
                <Input id="estoque" name="estoque" type="number" value={currentProduct?.estoque ?? ''} onChange={(e) => setCurrentProduct(prev => prev ? { ...prev, estoque: parseFloat(e.target.value) } : null)} className="col-span-3 bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoria_id" className="text-right">Categoria</Label>
                <Select onValueChange={(value) => setCurrentProduct(prev => prev ? { ...prev, categoria_id: value } : null)} value={currentProduct.categoria_id}>
                  <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="raridade_id" className="text-right">Raridade</Label>
                <Select onValueChange={(value) => setCurrentProduct(prev => prev ? { ...prev, raridade_id: value } : null)} value={currentProduct.raridade_id}>
                  <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecione uma raridade" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    {rarities.map(rarity => (
                      <SelectItem key={rarity.id} value={rarity.id}>{rarity.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="heroi_id" className="text-right">Herói</Label>
                <Select onValueChange={(value) => setCurrentProduct(prev => prev ? { ...prev, heroi_id: value } : null)} value={currentProduct.heroi_id}>
                  <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecione um herói" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    {heroes.map(hero => (
                      <SelectItem key={hero.id} value={hero.id}>{hero.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="destaque" className="text-right">Destaque</Label>
                <Switch id="destaque" checked={currentProduct.destaque} onCheckedChange={(checked) => setCurrentProduct(prev => prev ? { ...prev, destaque: checked } : null)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mega_destaque" className="text-right">Mega Destaque</Label>
                <Switch id="mega_destaque" checked={currentProduct.mega_destaque} onCheckedChange={(checked) => setCurrentProduct(prev => prev ? { ...prev, mega_destaque: checked } : null)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imagens" className="text-right">Imagens (URLs)</Label>
                <Textarea id="imagens" name="imagens" value={currentProduct.imagens.join('\n')} onChange={(e) => setCurrentProduct(prev => prev ? { ...prev, imagens: e.target.value.split('\n') } : null)} className="col-span-3 bg-gray-800 border-gray-700 text-white" placeholder="Uma URL por linha" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={() => handleSave(currentProduct, fetchProducts, setIsEditDialogOpen)} className="bg-neon-green text-game-dark hover:bg-neon-green/90">Salvar mudanças</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-game-dark text-white border border-neon-green/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neon-green">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-400 hover:text-white border-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

  const handleSave = async (product: Product, fetchProducts: () => void, setIsEditDialogOpen: (isOpen: boolean) => void) => {
    try {
      const { id, nome, descricao, preco, categoria_id, raridade_id, destaque, imagens, mega_destaque, desconto_porcentagem, estoque, heroi_id } = product;

      const { error } = await supabase.from('items').update({
        nome,
        descricao,
        preco,
        categoria_id,
        raridade_id,
        destaque,
        imagens,
        mega_destaque,
        desconto_porcentagem,
        estoque,
        heroi_id // Garante que heroi_id é o ID e não o objeto
      }).eq('id', id);

      if (error) throw error;
      toast.success("Produto atualizado com sucesso!");
      fetchProducts();
      setIsEditDialogOpen(false);
    } catch (err: any) {
      toast.error("Erro ao atualizar produto: " + err.message);
    }
  };

export default ManageProducts;