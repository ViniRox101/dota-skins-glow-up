
import { Instagram, Youtube, X, Shirt } from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    { name: 'Instagram', icon: <Instagram size={20} />, href: 'https://www.instagram.com/dotaplaybrasil/' },
    { name: 'Youtube', icon: <Youtube size={20} />, href: 'https://www.youtube.com/@DotaPlayBrasil' },
    { name: 'X', icon: <X size={20} />, href: 'https://x.com/dotaplaybrasil' },
    { name: 'Camisetas', icon: <Shirt size={20} />, href: 'https://www.canva.com/design/DAGlw8lmq48/9rbJyK4fi6NV5kOcHC5daw/view?utm_content=DAGlw8lmq48&utm_campaign=share_your_design&utm_medium=link2&utm_source=shareyourdesignpanel' },
  ];

  const footerLinks = [
    {
      title: 'Produto',
      links: ['Skins']
    },
    {
      title: 'Suporte',
      links: ['FAQ', 'Contato']
    }
  ];

  return (
    <footer className="bg-game-dark border-t border-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Main footer content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-neon-green to-cyber-blue rounded-lg flex items-center justify-center">
                <span className="text-game-dark font-bold">D</span>
              </div>
              <span className="text-white font-bold text-2xl">
                DotaPlay<span className="text-neon-green">Skins</span>
              </span>
            </div>
            
            <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
              A plataforma mais confiável para comprar, vender e trocar skins exclusivas de Dota 2. 
              Feito com ❤️ por jogadores para jogadores.
            </p>
            
            {/* Social links */}
            <h4 className="text-white font-semibold text-lg mb-4">Nossas redes sociais</h4>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="group w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-neon-green transition-all duration-300 transform hover:scale-110"
                >
                  <span className="text-xl group-hover:text-game-dark transition-colors duration-300">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Footer links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-semibold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href={link === 'Skins' ? '/skins' : link === 'FAQ' ? '/faq' : link === 'Sobre' ? '/sobre' : '#'} // Mantém a lógica de links existentes
                      className="text-gray-400 hover:text-neon-green transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter section */}
        <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700/50 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-white text-2xl font-bold mb-2">
                Fique por dentro das <span className="text-neon-green">novidades</span>
              </h3>
              <p className="text-gray-400">
                Receba ofertas exclusivas e seja o primeiro a saber sobre novos lançamentos
              </p>
            </div>
            <div className="flex gap-4">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green transition-colors duration-300"
              />
              <button className="px-6 py-3 bg-neon-green text-game-dark font-semibold rounded-lg hover:bg-neon-green/90 transition-all duration-300 transform hover:scale-105">
                Inscrever
              </button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-gray-400 text-center md:text-left">
              <p>© 2025 DotaPlaySkins. Todos os direitos reservados.</p>
              <p className="text-sm mt-1">
                Feito com <span className="text-red-500">❤️</span> por jogadores para jogadores
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span>Sistema Online</span>
              </span>
              <span>|</span>
              <span>Suporte 24/7</span>
              <span>|</span>
              <span>Entrega Instantânea</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
