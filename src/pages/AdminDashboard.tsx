import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Home, Package, Package2, ShoppingCart, Users, LineChart, List, PlusCircle, Tag, MessageSquare, Settings, User, Activity } from "lucide-react";
import { Button } from '@/components/ui/button';
import Dashboard from './Dashboard';
import ManageProducts from './ManageProducts';

const AdminDashboard: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-game-dark text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-game-dark border-r border-neon-green/20 p-4 flex flex-col shadow-lg shadow-neon-green/10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neon-green glow-text">DotaPlay Admin</h1>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link to="/admin" className="flex items-center p-2 text-gray-300 hover:bg-neon-green/20 rounded-md transition-colors duration-200">
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin/add-product" className="flex items-center space-x-3 p-2 rounded-md text-gray-300 hover:bg-neon-green/20 hover:text-neon-green transition-colors duration-200">
                <PlusCircle className="h-5 w-5" />
                <span>Cadastrar Produto</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/manage-categories" className="flex items-center space-x-3 p-2 rounded-md text-gray-300 hover:bg-neon-green/20 hover:text-neon-green transition-colors duration-200">
                <List className="h-5 w-5" />
                <span>Gerenciar Categorias</span>
              </Link>
            </li>

            <li>
              <Link to="/admin/manage-heroes" className="flex items-center space-x-3 p-2 rounded-md text-gray-300 hover:bg-neon-green/20 hover:text-neon-green transition-colors duration-200">
                <User className="h-5 w-5" />
                <span>Gerenciar Heróis</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/manage-equippable-parts" className="flex items-center space-x-3 p-2 rounded-md text-gray-300 hover:bg-neon-green/20 hover:text-neon-green transition-colors duration-200">
                <Tag className="h-5 w-5" />
                <span>Gerenciar Partes Equipáveis</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/manage-rarities" className="flex items-center space-x-3 p-2 rounded-md text-gray-300 hover:bg-neon-green/20 hover:text-neon-green transition-colors duration-200">
                <List className="h-5 w-5" />
                <span>Gerenciar Raridades</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/manage-products" className="flex items-center p-2 text-gray-300 hover:bg-neon-green/20 rounded-md transition-colors duration-200">
                <Package className="mr-3 h-5 w-5" />
                Produtos
              </Link>
            </li>
            <li>
              <Link to="/admin/giveaway" className="flex items-center space-x-3 p-2 rounded-md text-gray-300 hover:bg-neon-green/20 hover:text-neon-green transition-colors duration-200">
                <List className="h-5 w-5" />
                <span>Sorteio</span>
              </Link>
            </li>


          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-game-dark border-b border-neon-green/20 p-4 flex justify-between items-center shadow-lg shadow-neon-green/10">
          <h2 className="text-xl font-semibold text-neon-green">Administração DotaPlay</h2>
          <Button variant="ghost" className="text-gray-300 hover:bg-neon-green/20 rounded-full p-2">
            <User className="h-6 w-6" />
          </Button>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;