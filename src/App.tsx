import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AddProduct from "./pages/AddProduct";
import ManageCategories from './pages/ManageCategories';

import SkinsPage from './pages/SkinsPage';
import ProductPage from './pages/ProductPage';
import Dashboard from "./pages/Dashboard";
import ManageProducts from "./pages/ManageProducts";
import ManageHeroes from "./pages/ManageHeroes";
import ManageEquippableParts from "./pages/ManageEquippableParts";
import ManageRarities from "./pages/ManageRarities";
import About from "./pages/About";
import FAQ from "./pages/FAQ";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/skins" element={<SkinsPage />} />
          <Route path="/products/:productName" element={<ProductPage />} />

          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Dashboard />} />
            <Route path="add-product" element={<AddProduct />} />
            <Route path="manage-categories" element={<ManageCategories />} />
  
            <Route path="manage-heroes" element={<ManageHeroes />} />
            <Route path="manage-equippable-parts" element={<ManageEquippableParts />} />
            <Route path="manage-rarities" element={<ManageRarities />} />
            <Route path="manage-products" element={<ManageProducts />} />
          </Route>
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
