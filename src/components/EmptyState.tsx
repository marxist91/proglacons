'use client';

import React from 'react';
import { ShoppingCart, Search, Heart, Package, Bell, MapPin, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  type: 'cart' | 'search' | 'favorites' | 'orders' | 'notifications' | 'tracking';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Illustrations SVG inline pour les états vides
const illustrations = {
  cart: (
    <svg viewBox="0 0 200 200" className="w-48 h-48">
      <defs>
        <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ADEF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      {/* Panier */}
      <path
        d="M50 60 L70 60 L80 130 L150 130 L160 80 L85 80"
        fill="none"
        stroke="url(#cartGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-draw"
      />
      {/* Roues */}
      <circle cx="90" cy="145" r="10" fill="url(#cartGradient)" className="animate-pulse" />
      <circle cx="140" cy="145" r="10" fill="url(#cartGradient)" className="animate-pulse" />
      {/* Flocons de neige */}
      <g className="animate-float-slow">
        <circle cx="100" cy="40" r="3" fill="#00ADEF" opacity="0.6" />
        <circle cx="130" cy="50" r="2" fill="#00ADEF" opacity="0.4" />
        <circle cx="70" cy="45" r="2.5" fill="#1E3A8A" opacity="0.5" />
      </g>
      {/* Point d'interrogation */}
      <text x="115" y="110" fontSize="24" fill="#00ADEF" opacity="0.3" className="animate-bounce">?</text>
    </svg>
  ),
  
  search: (
    <svg viewBox="0 0 200 200" className="w-48 h-48">
      <defs>
        <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ADEF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      {/* Loupe */}
      <circle
        cx="90"
        cy="85"
        r="40"
        fill="none"
        stroke="url(#searchGradient)"
        strokeWidth="5"
        className="animate-pulse"
      />
      <line
        x1="120"
        y1="115"
        x2="155"
        y2="150"
        stroke="url(#searchGradient)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Flocons dans la loupe */}
      <g opacity="0.5">
        <path d="M85 75 L85 65 M85 75 L78 80 M85 75 L92 80" stroke="#00ADEF" strokeWidth="2" strokeLinecap="round" />
        <path d="M95 90 L95 82 M95 90 L90 94 M95 90 L100 94" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Étoiles décoratives */}
      <circle cx="45" cy="60" r="3" fill="#00ADEF" className="animate-twinkle" />
      <circle cx="150" cy="70" r="2" fill="#1E3A8A" className="animate-twinkle" style={{ animationDelay: '0.5s' }} />
      <circle cx="55" cy="120" r="2.5" fill="#00ADEF" className="animate-twinkle" style={{ animationDelay: '1s' }} />
    </svg>
  ),
  
  favorites: (
    <svg viewBox="0 0 200 200" className="w-48 h-48">
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>
      </defs>
      {/* Coeur principal */}
      <path
        d="M100 160 C40 110 30 70 60 50 C80 35 100 50 100 70 C100 50 120 35 140 50 C170 70 160 110 100 160"
        fill="none"
        stroke="url(#heartGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-heart-beat"
      />
      {/* Petits coeurs flottants */}
      <g className="animate-float-slow">
        <path d="M50 80 C47 76 45 70 50 68 C53 66 55 70 55 72 C55 70 57 66 60 68 C65 70 63 76 55 80 Z" fill="#EC4899" opacity="0.4" />
        <path d="M145 60 C143 57 142 53 145 52 C147 51 148 53 148 54 C148 53 149 51 151 52 C154 53 153 57 148 60 Z" fill="#F43F5E" opacity="0.4" />
      </g>
      {/* Flocons */}
      <circle cx="70" cy="140" r="3" fill="#00ADEF" opacity="0.4" className="animate-pulse" />
      <circle cx="130" cy="45" r="2" fill="#00ADEF" opacity="0.3" className="animate-pulse" />
    </svg>
  ),
  
  orders: (
    <svg viewBox="0 0 200 200" className="w-48 h-48">
      <defs>
        <linearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ADEF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      {/* Boîte */}
      <rect x="50" y="70" width="100" height="80" rx="8" fill="none" stroke="url(#boxGradient)" strokeWidth="4" />
      {/* Couvercle */}
      <path d="M40 70 L100 40 L160 70" fill="none" stroke="url(#boxGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="100" y1="40" x2="100" y2="70" stroke="url(#boxGradient)" strokeWidth="4" />
      {/* Ruban/fermeture */}
      <line x1="100" y1="70" x2="100" y2="150" stroke="url(#boxGradient)" strokeWidth="2" strokeDasharray="5,5" opacity="0.5" />
      {/* Flocons de glace autour */}
      <g className="animate-float-slow">
        <circle cx="40" cy="100" r="4" fill="#00ADEF" opacity="0.5" />
        <circle cx="165" cy="90" r="3" fill="#1E3A8A" opacity="0.4" />
        <circle cx="50" cy="160" r="2.5" fill="#00ADEF" opacity="0.4" />
      </g>
    </svg>
  ),
  
  notifications: (
    <svg viewBox="0 0 200 200" className="w-48 h-48">
      <defs>
        <linearGradient id="bellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ADEF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      {/* Cloche */}
      <path
        d="M100 45 C70 45 55 70 55 95 L55 115 L45 130 L155 130 L145 115 L145 95 C145 70 130 45 100 45"
        fill="none"
        stroke="url(#bellGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-bell-ring"
      />
      {/* Poignée */}
      <line x1="100" y1="25" x2="100" y2="45" stroke="url(#bellGradient)" strokeWidth="4" strokeLinecap="round" />
      {/* Battant */}
      <ellipse cx="100" cy="145" rx="15" ry="10" fill="none" stroke="url(#bellGradient)" strokeWidth="3" />
      {/* Ondes sonores (silence) */}
      <path d="M50 80 Q35 100 50 120" fill="none" stroke="#00ADEF" strokeWidth="2" opacity="0.3" strokeDasharray="5,5" />
      <path d="M150 80 Q165 100 150 120" fill="none" stroke="#00ADEF" strokeWidth="2" opacity="0.3" strokeDasharray="5,5" />
      {/* Z pour sommeil */}
      <text x="155" y="55" fontSize="16" fill="#00ADEF" opacity="0.5" className="animate-pulse">Z</text>
      <text x="165" y="45" fontSize="12" fill="#1E3A8A" opacity="0.4" className="animate-pulse" style={{ animationDelay: '0.3s' }}>z</text>
    </svg>
  ),
  
  tracking: (
    <svg viewBox="0 0 200 200" className="w-48 h-48">
      <defs>
        <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ADEF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      {/* Carte pliée */}
      <rect x="40" y="60" width="120" height="100" rx="8" fill="none" stroke="url(#mapGradient)" strokeWidth="3" opacity="0.4" />
      <line x1="100" y1="60" x2="100" y2="160" stroke="url(#mapGradient)" strokeWidth="2" opacity="0.3" strokeDasharray="5,5" />
      {/* Marqueur de position */}
      <g className="animate-bounce">
        <path
          d="M100 50 C85 50 70 65 70 85 C70 110 100 140 100 140 C100 140 130 110 130 85 C130 65 115 50 100 50"
          fill="url(#mapGradient)"
          opacity="0.8"
        />
        <circle cx="100" cy="82" r="12" fill="white" />
      </g>
      {/* Route pointillée */}
      <path d="M50 150 Q75 120 100 140 Q125 160 150 130" fill="none" stroke="#00ADEF" strokeWidth="3" strokeDasharray="8,8" opacity="0.5" className="animate-dash" />
    </svg>
  ),
};

const defaultContent = {
  cart: {
    title: 'Votre panier est vide',
    description: 'Ajoutez des produits pour commencer votre commande de glaçons premium',
  },
  search: {
    title: 'Aucun résultat trouvé',
    description: 'Essayez avec d\'autres termes de recherche ou parcourez notre catalogue',
  },
  favorites: {
    title: 'Pas encore de favoris',
    description: 'Marquez vos produits préférés d\'un ❤️ pour les retrouver ici',
  },
  orders: {
    title: 'Aucune commande',
    description: 'Passez votre première commande et suivez-la ici',
  },
  notifications: {
    title: 'Aucune notification',
    description: 'Vous êtes à jour ! Les nouvelles notifications apparaîtront ici',
  },
  tracking: {
    title: 'Aucune livraison en cours',
    description: 'Vos livraisons actives s\'afficheront ici avec leur suivi en temps réel',
  },
};

const icons = {
  cart: ShoppingCart,
  search: Search,
  favorites: Heart,
  orders: Package,
  notifications: Bell,
  tracking: MapPin,
};

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  action,
}) => {
  const Icon = icons[type];
  const content = defaultContent[type];
  const illustration = illustrations[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
      {/* Illustration */}
      <div className="relative mb-6">
        {illustration}
        
        {/* Effet de brillance */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-0 right-0 w-6 h-6 text-[#00ADEF] opacity-60 animate-twinkle" />
          <Sparkles className="absolute bottom-4 left-4 w-4 h-4 text-[#1E3A8A] opacity-40 animate-twinkle" style={{ animationDelay: '0.7s' }} />
        </div>
      </div>

      {/* Titre */}
      <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#00ADEF]" />
        {title || content.title}
      </h3>

      {/* Description */}
      <p className="text-[var(--foreground-muted)] max-w-sm mb-6">
        {description || content.description}
      </p>

      {/* Action */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-[#00ADEF] to-[#1E3A8A] text-white font-semibold rounded-xl shadow-lg shadow-[#00ADEF]/20 hover:shadow-xl hover:shadow-[#00ADEF]/30 transform hover:scale-105 transition-all duration-300 active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Composant pour afficher un état vide minimal (inline)
interface InlineEmptyProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

export const InlineEmpty: React.FC<InlineEmptyProps> = ({
  message,
  icon,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center gap-3 py-8 text-[var(--foreground-muted)] ${className}`}>
      {icon || <Package className="w-5 h-5 opacity-50" />}
      <span className="text-sm">{message}</span>
    </div>
  );
};

export default EmptyState;
