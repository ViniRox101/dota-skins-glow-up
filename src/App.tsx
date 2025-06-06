import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AddProduct from "./pages/AddProduct";
import ManageCategories from './pages/ManageCategories';
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import SkinsPage from './pages/SkinsPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import Dashboard from "./pages/Dashboard";
import ManageProducts from "./pages/ManageProducts";
import ManageHeroes from "./pages/ManageHeroes";
import ManageEquippableParts from "./pages/ManageEquippableParts";
import ManageRarities from "./pages/ManageRarities";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Giveaway from "./pages/Giveaway";
import Cancel from "./pages/cancel";
import Success from "./pages/Success";
import SalesDashboard from "./pages/SalesDashboard";

import { CartProvider } from "./contexts/CartContext";
import StripeProvider from "./components/StripeProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StripeProvider>
        <CartProvider>
          <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/skins" element={<SkinsPage />} />
          <Route path="/products/:productName" element={<ProductPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/cancel" element={<Cancel />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cart" element={<CartPage />} />
          
          {/* Rotas protegidas que exigem autenticação */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Rotas de administração protegidas */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<Dashboard />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="manage-categories" element={<ManageCategories />} />
              <Route path="manage-heroes" element={<ManageHeroes />} />
              <Route path="manage-equippable-parts" element={<ManageEquippableParts />} />
              <Route path="manage-rarities" element={<ManageRarities />} />
              <Route path="manage-products" element={<ManageProducts />} />
              <Route path="sales" element={<SalesDashboard />} />
              <Route path="giveaway" element={<Giveaway />} />

            </Route>
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </CartProvider>
      </StripeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
