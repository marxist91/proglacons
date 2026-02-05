import { Product, Service } from '@/types';

export const COLORS = {
  primary: '#00ADEF',
  secondary: '#1E3A8A',
  accent: '#7DD3FC',
  bg: '#e7f1f3',
};

export const CATEGORIES = ['Glaçons', 'Ice Cup', 'Carbo Glace', 'Pack'] as const;

export const UNITS = ['Sachet 5kg', 'Unité', 'Carton 4kg', 'Sachet 1kg', 'Pack', 'Sac'] as const;

export const NEIGHBORHOODS = [
  { name: 'Hédzranawoé / Aéroport', fee: 500, estimatedTime: '15-25 min' },
  { name: 'Agoè-Nyivé / Assiyéyé', fee: 1000, estimatedTime: '25-35 min' },
  { name: 'Adidogomé / Amadahomé', fee: 1500, estimatedTime: '30-45 min' },
  { name: 'Grand Marché / Dékon', fee: 1000, estimatedTime: '25-35 min' },
  { name: 'Bè / Akodésséwa', fee: 800, estimatedTime: '20-30 min' },
  { name: 'Baguidab / Avepozo', fee: 2000, estimatedTime: '40-55 min' },
  { name: 'Ségbé / Golf', fee: 1500, estimatedTime: '30-40 min' },
];

// Codes promo valides
export const PROMO_CODES: Record<string, { discount: number; type: 'percent' | 'fixed'; minOrder?: number; description: string }> = {
  'BIENVENUE10': { discount: 10, type: 'percent', description: '10% de réduction' },
  'FRAIS500': { discount: 500, type: 'fixed', description: '500 FCFA de réduction' },
  'ETE2026': { discount: 15, type: 'percent', minOrder: 10000, description: '15% dès 10,000 FCFA' },
  'FIDELITE20': { discount: 20, type: 'percent', minOrder: 15000, description: '20% dès 15,000 FCFA' },
  'GRATUIT': { discount: 100, type: 'percent', minOrder: 50000, description: 'Livraison offerte dès 50,000 FCFA' },
};

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cubes de Luxe (Isotherme)',
    description: 'Plus résistants, fraîcheur longue durée. Idéal pour les événements et les longs trajets.',
    price: 3500,
    category: 'Glaçons',
    unit: 'Sachet 5kg',
    imageUrl: '/images/IMG_0554.jpg',
    tag: 'Populaire',
    inStock: true,
    stock_quantity: 100
  },
  {
    id: '2',
    name: 'Grains de Luxe (Isotherme)',
    description: 'Fins et homogènes, gardent la fraîcheur plus longtemps grâce à leur format grain.',
    price: 3500,
    category: 'Glaçons',
    unit: 'Sachet 5kg',
    imageUrl: '/images/IMG_0555.jpg',
    inStock: true,
    stock_quantity: 100
  },
  {
    id: '3',
    name: 'Glaçons Classiques',
    description: 'Solides et prêts à l usage immédiat pour rafraîchir toutes vos boissons.',
    price: 3300,
    category: 'Glaçons',
    unit: 'Sachet 5kg',
    imageUrl: '/images/IMG_0556.jpg',
    inStock: true,
    stock_quantity: 100
  },
  {
    id: '4',
    name: 'Ice Cup Cubes',
    description: 'Verre de glaçons en cube scellé, fond lent, fraîcheur durable prête à consommer.',
    price: 500,
    category: 'Ice Cup',
    unit: 'Unité',
    imageUrl: '/images/IMG_0557.jpg',
    tag: 'Tendance',
    inStock: true,
    stock_quantity: 100
  },
  {
    id: '5',
    name: 'Ice Cup Grains',
    description: 'Texture fine et homogène, le rafraîchissement parfait pour vos boissons à emporter.',
    price: 500,
    category: 'Ice Cup',
    unit: 'Unité',
    imageUrl: '/images/IMG_0554.jpg',
    inStock: true,
    stock_quantity: 100
  },
  {
    id: '6',
    name: 'Carbo Glace (Carton)',
    description: 'Glace carbonique conservée au frais pour usage industriel ou effets spéciaux.',
    price: 40000,
    category: 'Carbo Glace',
    unit: 'Carton 4kg',
    imageUrl: '/images/IMG_0555.jpg',
    inStock: true,
    stock_quantity: 50
  },
  {
    id: '7',
    name: 'Carbo Glace (Sachet)',
    description: 'Format pratique 1kg pour garder vos produits au froid durant les trajets courts.',
    price: 10000,
    category: 'Carbo Glace',
    unit: 'Sachet 1kg',
    imageUrl: '/images/IMG_0556.jpg',
    inStock: true,
    stock_quantity: 200
  },
  {
    id: '8',
    name: 'Pack Événement',
    description: 'Pack complet incluant 10 sachets de luxe et 20 Ice Cups pour vos soirées.',
    price: 39000,
    category: 'Pack',
    unit: 'Pack',
    imageUrl: '/images/IMG_0557.jpg',
    tag: 'Offre Spéciale',
    inStock: true,
    stock_quantity: 20
  }
];

export const SERVICES: Service[] = [
  {
    title: 'Production & Vente',
    description: 'Production et vente de glaçons alimentaires et cubes premium de haute qualité certifiée.',
    icon: 'Factory'
  },
  {
    title: 'Livraison Rapide',
    description: 'Livraison rapide pour particuliers, restaurants, hôtels et événements partout à Lomé.',
    icon: 'Truck'
  },
  {
    title: 'Carbo Glace',
    description: 'Carbo Glace (Glace carbonique) pour usage industriel, commercial et conservation thermique.',
    icon: 'Snowflake'
  },
  {
    title: 'Conseils Experts',
    description: 'Conseils personnalisés pour vos besoins en froid et conservation thermique longue durée.',
    icon: 'Info'
  }
];
