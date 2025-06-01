import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox'; // Importa o componente Checkbox
import { createClient } from '@supabase/supabase-js';

// Removido: import ImageUpload from '@/components/ui/ImageUpload'; // Não está sendo usado diretamente aqui

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AddProduct: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [stock, setStock] = useState<number | string>('');
  const [showWhenSoldOut, setShowWhenSoldOut] = useState<boolean>(false);
  const [isMegaFeatured, setIsMegaFeatured] = useState<boolean>(false); // Novo estado para 'Mega Destaque'
  const [discountPercentage, setDiscountPercentage] = useState<string>('0'); // Estado para a porcentagem de desconto

  const [category, setCategory] = useState('');

  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // Estado para a URL da imagem (não usado no submit, mas pode ser útil)
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; nome: string }>>([]);
  const [availableHeroes, setAvailableHeroes] = useState<Array<{ id: string; nome: string }>>([]);
  const [selectedHero, setSelectedHero] = useState('');
  const [availableEquippableParts, setAvailableEquippableParts] = useState<Array<{ id: string; nome: string }>>([]);
  const [selectedEquippablePart, setSelectedEquippablePart] = useState('');
  const [availableRarities, setAvailableRarities] = useState<Array<{ id: string; nome: string }>>([]);
  const [selectedRarity, setSelectedRarity] = useState('');

  useEffect(() => {

    fetchCategories();
    fetchHeroes();
    fetchEquippableParts();
    fetchRarities();
  }, []);



  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome');
    if (error) {
      console.error('Erro ao buscar categorias:', error.message);
    } else {
      setAvailableCategories(data || []);
    }
  };

  const fetchHeroes = async () => {
    const { data, error } = await supabase
      .from('herois')
      .select('id, nome');
    if (error) {
      console.error('Erro ao buscar heróis:', error.message);
    } else {
      setAvailableHeroes(data || []);
    }
  };

  const fetchEquippableParts = async () => {
    const { data, error } = await supabase
      .from('partes_equipaveis')
      .select('id, nome');
    if (error) {
      console.error('Erro ao buscar partes equipáveis:', error.message);
    } else {
      setAvailableEquippableParts(data || []);
    }
  };

  const fetchRarities = async () => {
    const { data, error } = await supabase
      .from('raridades')
      .select('id, nome');
    if (error) {
      console.error('Erro ao buscar raridades:', error.message);
    } else {
      setAvailableRarities(data || []);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      // Opcional: gerar preview da imagem aqui se necessário
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validação de campos obrigatórios
    if (!name || !description || !price || !category || !imageFile || stock === '') {
      setError('Por favor, preencha todos os campos, selecione uma imagem e informe o estoque.');
      setLoading(false);
      return;
    }

    // Verificação de nome duplicado
    const { data: existingProducts, error: checkError } = await supabase
      .from('items')
      .select('id')
      .eq('nome', name);

    if (checkError) {
      console.error('Erro ao verificar nome duplicado:', checkError.message);
      setError('Erro ao verificar nome duplicado. Tente novamente.');
      setLoading(false);
      return;
    }

    if (existingProducts && existingProducts.length > 0) {
      setError('Já existe um produto com este nome. Por favor, escolha um nome diferente.');
      setLoading(false);
      return;
    }

    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Por favor, insira um valor válido para o produto.');
      setLoading(false);
      return;
    }

    let uploadedImageUrl: string | null = null; // Usar variável local para a URL no submit

    try {
      console.log('Iniciando upload da imagem para o Supabase Storage...');

      const filePath = `product-images/${Date.now()}-${imageFile.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Erro no upload da imagem:', uploadError);
        throw uploadError;
      }

      console.log('Caminho do arquivo retornado pelo Supabase:', uploadData.path);

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(uploadData.path);

      uploadedImageUrl = publicUrlData.publicUrl;
      console.log('URL da imagem gerada:', uploadedImageUrl);

      const { data, error: insertError } = await supabase
        .from('items')
        .insert([
          {
            nome: name,
            descricao: description,
            preco: numericPrice,
            categoria_id: category,

            destaque: isFeatured,
            imagens: uploadedImageUrl ? [uploadedImageUrl] : [],
            estoque: parseInt(stock as string),
            mostrar_quando_esgotado: showWhenSoldOut,
            mega_destaque: isMegaFeatured, // Adiciona o campo 'mega_destaque'
            heroi_id: selectedHero || null,
            parte_equipavel_id: selectedEquippablePart || null,
            raridade_id: selectedRarity || null,
            desconto_porcentagem: discountPercentage === '0' ? null : parseInt(discountPercentage as string),
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      setSuccess('Produto cadastrado com sucesso!');
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setShowWhenSoldOut(false);
      setIsMegaFeatured(false); // Limpar o estado de megaDestaque
      setCategory('');

      setIsFeatured(false);
      setImageFile(null);
      setImageUrl(null); // Limpar o estado imageUrl também, se estiver sendo usado
      setError(null);

    } catch (err: any) {
      console.error('Erro no processo de cadastro:', err);
      setError(`Erro ao cadastrar produto: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Adicionar Novo Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do Produto" />
              </div>
            <div className="mb-4">
              <Label htmlFor="price">Preço</Label>
              <Input
                id="price"
                type="number"
                placeholder="Preço"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="discount">Desconto</Label>
              <Select
                onValueChange={(value) => setDiscountPercentage(value)}
                value={discountPercentage}
              >
                <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione um desconto" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="0">Sem desconto</SelectItem>
                  {[...Array(19)].map((_, i) => {
                    const percentage = (i + 1) * 5;
                    return (
                      <SelectItem key={percentage} value={String(percentage)}>
                        {percentage}%
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do Produto" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero">Herói</Label>
              <Select value={selectedHero} onValueChange={setSelectedHero}>
                <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione um herói" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  {availableHeroes.map((hero) => (
                    <SelectItem key={hero.id} value={hero.id}>
                      {hero.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="equippablePart">Parte Equipável</Label>
              <Select value={selectedEquippablePart} onValueChange={setSelectedEquippablePart}>
                <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione uma parte equipável" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  {availableEquippableParts.map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rarity">Raridade</Label>
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione uma raridade" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  {availableRarities.map((rarity) => (
                    <SelectItem key={rarity.id} value={rarity.id}>
                      {rarity.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Estoque" />
              </div>
              <div className="space-y-2 flex items-center space-x-2 mt-7">
                <Input
                  id="showWhenSoldOut"
                  type="checkbox"
                  checked={showWhenSoldOut}
                  onChange={(e) => setShowWhenSoldOut(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <Label htmlFor="showWhenSoldOut">Mostrar quando esgotado</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="highlight">Destaque</Label>
              <Input
                id="highlight"
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMegaFeatured"
                checked={isMegaFeatured}
                onCheckedChange={(checked) => setIsMegaFeatured(checked as boolean)}
              />
              <Label htmlFor="isMegaFeatured">Mega Destaque</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Imagem do Produto</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Produto'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProduct;