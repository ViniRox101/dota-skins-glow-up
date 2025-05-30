import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@supabase/supabase-js';
import TagInput from '@/components/ui/TagInput';
// Removido: import ImageUpload from '@/components/ui/ImageUpload'; // Não está sendo usado diretamente aqui

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AddProduct: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [stock, setStock] = useState<number | string>(''); // Novo estado para estoque
  const [showWhenSoldOut, setShowWhenSoldOut] = useState<boolean>(false); // Novo estado para 'mostrar quando esgotado'

  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<Array<{ id: string; nome: string; cor_hex: string }>>([]); // Alterado para array de objetos
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // Estado para a URL da imagem (não usado no submit, mas pode ser útil)
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [availableTags, setAvailableTags] = useState<Array<{ id: string; nome: string; cor_hex: string }>>([]);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; nome: string }>>([]);

  useEffect(() => {
    fetchTags();
    fetchCategories();
  }, []);

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('tags_coloridas')
      .select('id, nome, cor_hex');
    if (error) {
      console.error('Erro ao buscar tags:', error.message);
    } else {
      setAvailableTags(data || []);
    }
  };

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
    if (!name || !description || !price || !category || tags.length === 0 || !imageFile || stock === '') {
      setError('Por favor, preencha todos os campos, adicione pelo menos uma tag, selecione uma imagem e informe o estoque.');
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
            tag_id: tags.length > 0 ? tags[0].id : null, // Assumindo que tag_id é um UUID único, pegando o primeiro ID
            destaque: isFeatured,
            imagens: uploadedImageUrl ? [uploadedImageUrl] : [], // `imagens` é um array de strings
            estoque: parseInt(stock as string), // Adiciona o campo de estoque
            mostrar_quando_esgotado: showWhenSoldOut, // Adiciona o campo 'mostrar quando esgotado'
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      setSuccess('Produto cadastrado com sucesso!');
      setName('');
      setDescription('');
      setPrice('');
      setStock(''); // Limpar o estado de estoque
      setShowWhenSoldOut(false); // Limpar o estado de mostrarQuandoEsgotado
      setCategory('');
      setTags([]);
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
              <div className="space-y-2">
                <Label htmlFor="price">Preço</Label>
                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do Produto" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <TagInput tags={tags} setTags={setTags} availableTags={availableTags} />
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