export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isNew: boolean;
  isFeatured: boolean; // Adicionar a propriedade isFeatured
  desconto_porcentagem?: number; // Adiciona a porcentagem de desconto
  stock: number; // Adicionar o campo de estoque
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Phantom Assassin - Manopla da Ruína Carmesim',
    description: 'Manopla da Ruína Carmesim para Phantom Assassin. Uma arma lendária forjada nas profundezas do Abismo, imbuída com o poder da sombra e da destruição.',
    price: 29.99,
    imageUrl: '/images/pa_glove.png',
    category: 'Manopla',
    isNew: true,
    isFeatured: true, // Marcar como destaque
    stock: 10, // Estoque inicial
  },
  {
    id: '2',
    name: 'Invoker - Capa do Mago Arcano',
    description: 'Capa do Mago Arcano para Invoker. Tecida com fios de pura magia, esta capa concede ao seu portador controle incomparável sobre os elementos.',
    price: 49.99,
    imageUrl: '/images/invoker_cape.png',
    category: 'Capa',
    isNew: false,
    isFeatured: true, // Marcar como destaque
    stock: 5, // Estoque inicial
  },
  {
    id: '3',
    name: 'Juggernaut - Lâmina do Guardião Dracônico',
    description: 'Lâmina do Guardião Dracônico para Juggernaut. Uma espada ancestral que pulsa com a fúria de dragões, capaz de cortar qualquer armadura.',
    price: 39.99,
    imageUrl: '/images/jugg_blade.png',
    category: 'Espada',
    isNew: true,
    isFeatured: false,
    stock: 7, // Estoque inicial
  },
  {
    id: '4',
    name: 'Pudge - Gancho do Açougueiro Sombrio',
    description: 'Gancho do Açougueiro Sombrio para Pudge. Forjado nas profundezas do submundo, este gancho é a ferramenta perfeita para arrastar inimigos para um destino sombrio.',
    price: 24.99,
    imageUrl: '/images/pudge_hook.png',
    category: 'Gancho',
    isNew: false,
    isFeatured: false,
    stock: 0, // Exemplo de item sem estoque
  },
];