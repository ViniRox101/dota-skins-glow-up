import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Folder, Tag, Edit, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

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
  mega_destaque: boolean;
  desconto_porcentagem: number | null;
  estoque: number;
  heroi_id: string;
  herois: { nome: string } | null;
  categorias: { nome: string } | null;
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

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLatestProducts();
    fetchCategories();
    fetchRarities();
    fetchHeroes();
  }, []);

  const fetchLatestProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, herois(nome), categorias(nome)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (err: any) {
      toast.error("Erro ao carregar últimos produtos: " + err.message);
    }
    finally {
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

  const handleSave = async () => {
    if (!currentProduct) return;
    try {
      const productToSave = { ...currentProduct };
      // Garante que heroi_id seja um UUID válido ou null
      if (productToSave.herois && productToSave.herois.nome) {
        const selectedHero = heroes.find(h => h.nome === productToSave.herois?.nome);
        productToSave.heroi_id = selectedHero ? selectedHero.id : '';
      } else if (productToSave.heroi_id === null) {
        // Se herois.nome for null, garante que heroi_id seja null
        productToSave.heroi_id = '';
      }

      // Remove a propriedade herois antes de enviar para o Supabase
      delete (productToSave as any).herois;
      delete (productToSave as any).categorias;

      const { error } = await supabase.from('items').update(productToSave).eq('id', productToSave.id);
      if (error) throw error;
      toast.success("Produto atualizado com sucesso!");
      setIsEditDialogOpen(false);
      fetchLatestProducts();
    } catch (err: any) {
      toast.error("Erro ao salvar produto: " + err.message);
    }
  };

  const handleChange = (name: string, value: any) => {
    if (!currentProduct) return;

    if (name === "destaque" || name === "mega_destaque") {
      setCurrentProduct({
        ...currentProduct,
        [name]: value,
      });
    } else if (name === "desconto_porcentagem") {
      setCurrentProduct({
        ...currentProduct,
        [name]: value === '' ? null : Number(value),
      });
    } else if (name === "preco" || name === "estoque") {
      setCurrentProduct({
        ...currentProduct,
        [name]: Number(value),
      });
    } else if (name === "categoria_id") {
      setCurrentProduct({
        ...currentProduct,
        categoria_id: value,
        categorias: categories.find(cat => cat.id === value) || null,
      });
    } else if (name === "raridade_id") {
      setCurrentProduct({
        ...currentProduct,
        raridade_id: value,
      });
    } else if (name === "heroi_id") {
      setCurrentProduct({
        ...currentProduct,
        heroi_id: value,
        herois: heroes.find(hero => hero.id === value) || null,
      });
    } else {
      setCurrentProduct({
        ...currentProduct,
        [name]: value,
      });
    }
  };

  const handleIncrement = (field: 'desconto_porcentagem' | 'estoque', amount: number) => {
    if (!currentProduct) return;
    setCurrentProduct(prev => {
      if (!prev) return null;
      const currentValue = prev[field] || 0;
      return {
        ...prev,
        [field]: currentValue + amount,
      };
    });
  };

  const handleDecrement = (field: 'desconto_porcentagem' | 'estoque', amount: number) => {
    if (!currentProduct) return;
    setCurrentProduct(prev => {
      if (!prev) return null;
      const currentValue = prev[field] || 0;
      return {
        ...prev,
        [field]: Math.max(0, currentValue - amount),
      };
    });
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neon-green mb-8">Painel de Controle</h1>

      {/* Cards de Controle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link to="/admin/add-product">
          <Card className="bg-game-dark border border-neon-green/20 shadow-lg shadow-neon-green/10 animate-fade-in cursor-pointer hover:bg-neon-green/10 transition-colors duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-gray-300">Cadastrar Produto</CardTitle>
              <Package className="h-6 w-6 text-neon-green" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-400">Adicione novos produtos ao catálogo.</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/manage-categories">
          <Card className="hover:shadow-lg transition-shadow duration-300 bg-gray-800 border-neon-green rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neon-green">Gerenciar Categorias</CardTitle>
              <List className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">+ Categorias</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/manage-heroes">
          <Card className="hover:shadow-lg transition-shadow duration-300 bg-gray-800 border-neon-green rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neon-green">Gerenciar Heróis</CardTitle>
              <Tag className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">+ Heróis</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Últimos Produtos Cadastrados */}
      <Card className="bg-game-dark border border-neon-green/20 shadow-lg shadow-neon-green/10 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neon-green">Últimos Produtos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-400">Carregando últimos produtos...</div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-400">Nenhum produto cadastrado ainda.</div>
          ) : (
            <ul className="space-y-4">
              {products.map(product => (
                <li key={product.id} className="flex items-center justify-between border-b border-neon-green/10 pb-4 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-gray-200 font-medium">{product.nome}</p>
                    <p className="text-gray-400 text-sm">Categoria: {product.categorias?.nome || 'N/A'}</p>
                  </div>
                  <Button
                    className="bg-green-500 text-black hover:bg-black hover:text-green-500"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </li>
              ))}
            </ul>
          )}

        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-game-dark text-white p-6 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-neon-green text-2xl">Editar Produto</DialogTitle>
          </DialogHeader>
          {currentProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right text-gray-300">Nome</Label>
                <Input id="nome" name="nome" value={currentProduct.nome} onChange={(e) => handleChange(e.target.name, e.target.value)} className="col-span-3 bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descricao" className="text-right text-gray-300">Descrição</Label>
                <Textarea id="descricao" name="descricao" value={currentProduct.descricao} onChange={(e) => handleChange(e.target.name, e.target.value)} className="col-span-3 bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="preco" className="text-right text-gray-300">Preço</Label>
                <Input id="preco" name="preco" type="number" value={currentProduct.preco} onChange={(e) => handleChange(e.target.name, e.target.value)} className="col-span-3 bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desconto_porcentagem" className="text-right text-gray-300">Desconto (%)</Label>
                <div className="col-span-3 flex items-center">
                  <Button variant="outline" onClick={() => handleDecrement('desconto_porcentagem', 5)} className="px-2 py-1 bg-gray-600 text-white rounded-l-md hover:bg-gray-500">-</Button>
                  <Input id="desconto_porcentagem" name="desconto_porcentagem" type="number" value={currentProduct.desconto_porcentagem ?? ''} onChange={(e) => handleChange(e.target.name, e.target.value)} className="w-20 text-center bg-gray-700 border-gray-600 text-white mx-1" />
                  <Button variant="outline" onClick={() => handleIncrement('desconto_porcentagem', 5)} className="px-2 py-1 bg-gray-600 text-white rounded-r-md hover:bg-gray-500">+</Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estoque" className="text-right text-gray-300">Estoque</Label>
                <div className="col-span-3 flex items-center">
                  <Button variant="outline" onClick={() => handleDecrement('estoque', 1)} className="px-2 py-1 bg-gray-600 text-white rounded-l-md hover:bg-gray-500">-</Button>
                  <Input id="estoque" name="estoque" type="number" value={currentProduct.estoque} onChange={(e) => handleChange(e.target.name, e.target.value)} className="w-20 text-center bg-gray-700 border-gray-600 text-white mx-1" />
                  <Button variant="outline" onClick={() => handleIncrement('estoque', 1)} className="px-2 py-1 bg-gray-600 text-white rounded-r-md hover:bg-gray-500">+</Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoria_id" className="text-right text-gray-300">Categoria</Label>
                <Select name="categoria_id" value={currentProduct.categoria_id} onValueChange={(value) => handleChange('categoria_id', value)}>
                  <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="raridade_id" className="text-right text-gray-300">Raridade</Label>
                <Select name="raridade_id" value={currentProduct.raridade_id} onValueChange={(value) => handleChange('raridade_id', value)}>
                  <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione uma raridade" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    {rarities.map(rar => (
                      <SelectItem key={rar.id} value={rar.id}>{rar.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="heroi_id" className="text-right text-gray-300">Herói</Label>
                <Select name="heroi_id" value={currentProduct.heroi_id} onValueChange={(value) => handleChange('heroi_id', value)}>
                  <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione um herói" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    {heroes.map(hero => (
                      <SelectItem key={hero.id} value={hero.id}>{hero.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="destaque" className="text-right text-gray-300">Destaque</Label>
                <Switch id="destaque" name="destaque" checked={currentProduct.destaque} onCheckedChange={(checked) => handleChange('destaque', checked)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mega_destaque" className="text-right text-gray-300">Mega Destaque</Label>
                <Switch id="mega_destaque" name="mega_destaque" checked={currentProduct.mega_destaque} onCheckedChange={(checked) => handleChange('mega_destaque', checked)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imagens" className="text-right text-gray-300">Imagens (URLs)</Label>
                <Textarea id="imagens" name="imagens" value={currentProduct.imagens.join('\n')} onChange={(e) => handleChange('imagens', e.target.value.split('\n'))} className="col-span-3 bg-gray-700 border-gray-600 text-white" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleSave} className="bg-neon-green text-black hover:bg-neon-green/80">
              Salvar mudanças
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;