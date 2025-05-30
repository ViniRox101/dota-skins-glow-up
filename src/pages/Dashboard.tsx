import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Folder, Tag, Edit, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const products = [
    { id: 1, name: 'Produto Fictício 1', category: 'Categoria A' },
    { id: 2, name: 'Produto Fictício 2', category: 'Categoria B' },
    { id: 3, name: 'Produto Fictício 3', category: 'Categoria A' },
  ];

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
        <Link to="/admin/manage-tags">
          <Card className="hover:shadow-lg transition-shadow duration-300 bg-gray-800 border-neon-green rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neon-green">Gerenciar Tags</CardTitle>
              <Tag className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">+ Tags</div>
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
          <ul className="space-y-4">
            {products.map(product => (
              <li key={product.id} className="flex items-center justify-between border-b border-neon-green/10 pb-4 last:border-b-0 last:pb-0">
                <div>
                  <p className="text-gray-200 font-medium">{product.name}</p>
                  <p className="text-gray-400 text-sm">Categoria: {product.category}</p>
                </div>
                <Button variant="outline" size="sm" className="border-neon-green/30 text-neon-green hover:bg-neon-green/10">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;