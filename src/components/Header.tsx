
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useMobile } from '../hooks/use-mobile.ts';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para controlar o menu mobile
  const isMobile = useMobile(); // Hook para detectar dispositivo móvel

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false); // Fechar o menu após clicar em um item
    }
  };

  const location = useLocation();
  const isSkinsPage = location.pathname === '/skins';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-game-dark/95 backdrop-blur-md border-b border-neon-green/20' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-neon-green to-cyber-blue rounded-lg flex items-center justify-center">
            <span className="text-game-dark font-bold text-sm">D</span>
          </div>
          <span className="text-white font-bold text-xl">
            DotaPlay<span className="text-neon-green">Skins</span>
          </span>
        </div>

        {/* Botão do menu hambúrguer para mobile */}
        {isMobile && (
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}

        {/* Menu de navegação para desktop */}
        <nav className={`hidden md:flex items-center space-x-8`}>
          <Link to="/" className="text-white hover:text-neon-green transition-colors duration-300">
            Home
          </Link>
          <Link
            to="/#featured-products-carousel"
            onClick={() => scrollToSection('featured-products-carousel')}
            className="text-white hover:text-neon-green transition-colors duration-300"
          >
            Destaque
          </Link>
          <Link to="/skins" className="text-white hover:text-neon-green transition-colors duration-300">
            Skins
          </Link>
          <Link 
            to="/about"
            className="text-white hover:text-neon-green transition-colors duration-300"
          >
            Sobre
          </Link>
          <Link 
            to="/faq"
            className="text-white hover:text-neon-green transition-colors duration-300"
          >
            FAQ
          </Link>
          <Link to="/login" className="text-white hover:text-neon-green transition-colors duration-300">
            Login
          </Link>
        </nav>

        {/* Menu mobile (condicional) */}
        {isMobile && isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-game-dark border-t border-neon-green/20 flex flex-col items-center py-4 space-y-4 animate-fade-in-down md:hidden shadow-lg rounded-b-lg">
            <Link to="/" className="block w-full text-center py-2 text-white hover:bg-neon-green hover:text-game-dark transition-colors duration-300 border-b border-neon-green/10" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link
              to="/#featured-products-carousel"
              onClick={() => scrollToSection('featured-products-carousel')}
              className="block w-full text-center py-2 text-white hover:bg-neon-green hover:text-game-dark transition-colors duration-300 border-b border-neon-green/10"
            >
              Destaque
            </Link>
            <Link to="/skins" className="block w-full text-center py-2 text-white hover:bg-neon-green hover:text-game-dark transition-colors duration-300 border-b border-neon-green/10" onClick={() => setIsMenuOpen(false)}>
              Skins
            </Link>
            <Link 
              to="/about"
              className="block w-full text-center py-2 text-white hover:bg-neon-green hover:text-game-dark transition-colors duration-300 border-b border-neon-green/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Sobre
            </Link>
            <Link 
              to="/faq"
              className="block w-full text-center py-2 text-white hover:bg-neon-green hover:text-game-dark transition-colors duration-300 border-b border-neon-green/10"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link to="/login" className="block w-full text-center py-2 text-white hover:bg-neon-green hover:text-game-dark transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
