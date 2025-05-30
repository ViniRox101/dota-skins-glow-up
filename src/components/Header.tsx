
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

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
    }
  };

  const location = useLocation();
  const isSkinsPage = location.pathname === '/skins';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-game-dark/95 backdrop-blur-md border-b border-neon-green/20' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-neon-green to-cyber-blue rounded-lg flex items-center justify-center">
            <span className="text-game-dark font-bold text-sm">D</span>
          </div>
          <span className="text-white font-bold text-xl">
            DotaPlay<span className="text-neon-green">Skins</span>
          </span>
        </div>

        <nav className="flex items-center space-x-8">
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
          {/* Packs Exclusivos removido conforme solicitado */}
          <Link 
            to="/#sobre"
            className="text-white hover:text-neon-green transition-colors duration-300"
          >
            Sobre
          </Link>
          <Link 
            to="/#faq"
            className="text-white hover:text-neon-green transition-colors duration-300"
          >
            FAQ
          </Link>
          <Link to="/login" className="text-white hover:text-neon-green transition-colors duration-300">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
