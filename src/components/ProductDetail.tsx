'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Minus, Plus, X, ChevronLeft } from 'lucide-react';
import { Product } from '@/types';
import { useApp } from '@/lib/context';
import { useTheme } from '@/lib/theme';
import { useHaptics } from '@/hooks/useHaptics';
import ProductReviews, { StarRating } from './ProductReviews';
import SocialShare from './SocialShare';

interface ProductDetailProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, isOpen, onClose }) => {
  const { addToCart, favorites, toggleFavorite, setIsCartOpen } = useApp();
  const { resolvedTheme } = useTheme();
  const { haptics } = useHaptics();
  const isDark = resolvedTheme === 'dark';
  const isFavorite = favorites.includes(product.id);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Bloquer le scroll du body quand ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    haptics.addToCart();
    onClose();
    setIsCartOpen(true);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product);
    haptics.toggleFavorite();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal plein écran */}
      <div className={`absolute inset-0 md:inset-4 lg:inset-8 ${isDark ? 'bg-slate-900' : 'bg-white'} md:rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-fade-in`}>
        
        {/* Header fixe */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-500 hover:text-[#00ADEF] transition-colors"
          >
            <ChevronLeft size={24} />
            <span className="font-medium hidden sm:inline">Retour</span>
          </button>
          
          <div className="flex items-center gap-3">
            <SocialShare product={product} compact />
            <button
              onClick={handleToggleFavorite}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500'
              }`}
            >
              <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="md:flex md:h-full">
            
            {/* Image - Grande sur desktop */}
            <div className={`md:w-1/2 lg:w-3/5 ${isDark ? 'bg-slate-800' : 'bg-slate-50'} flex items-center justify-center p-4 md:p-8`}>
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-w-full max-h-[300px] md:max-h-[500px] lg:max-h-[600px] object-contain"
              />
            </div>
            
            {/* Infos produit */}
            <div className="md:w-1/2 lg:w-2/5 p-6 md:p-8 md:overflow-y-auto">
              {/* Tag */}
              {product.tag && (
                <div className="inline-block bg-gradient-to-r from-[#1E3A8A] to-[#00ADEF] text-white text-xs font-bold px-4 py-2 rounded-full mb-4">
                  {product.tag}
                </div>
              )}
              
              <p className="text-sm font-bold text-[#00ADEF] uppercase tracking-widest mb-2">
                {product.category}
              </p>
              
              <h1 className="text-3xl md:text-4xl font-black text-[#1E3A8A] dark:text-white mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-3 mb-6">
                <StarRating rating={4.7} size={18} />
                <span className="text-slate-500">(156 avis)</span>
              </div>
              
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl md:text-5xl font-black text-[#1E3A8A] dark:text-white">
                  {product.price.toLocaleString()}
                </span>
                <span className="text-lg text-slate-400 font-bold">FCFA / {product.unit}</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 font-bold text-sm transition-colors ${
                    activeTab === 'details'
                      ? 'text-[#00ADEF] border-b-2 border-[#00ADEF]'
                      : 'text-slate-400'
                  }`}
                >
                  Détails
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-3 font-bold text-sm transition-colors ${
                    activeTab === 'reviews'
                      ? 'text-[#00ADEF] border-b-2 border-[#00ADEF]'
                      : 'text-slate-400'
                  }`}
                >
                  Avis clients
                </button>
              </div>

              {activeTab === 'details' ? (
                <div className="space-y-6">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                    {product.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                      <p className="text-xs text-slate-400 uppercase mb-1">Stock</p>
                      <p className="font-bold text-lg text-[#1E3A8A] dark:text-white">
                        {product.inStock ? `${product.stock_quantity} disponibles` : 'Rupture'}
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                      <p className="text-xs text-slate-400 uppercase mb-1">Livraison</p>
                      <p className="font-bold text-lg text-[#1E3A8A] dark:text-white">15-45 min</p>
                    </div>
                  </div>

                  <SocialShare product={product} />
                </div>
              ) : (
                <ProductReviews productId={product.id} productName={product.name} />
              )}
            </div>
          </div>
        </div>

        {/* Barre d'action fixe en bas */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
          <div className="flex items-center gap-4 max-w-xl mx-auto">
            {/* Sélecteur quantité */}
            <div className={`flex items-center rounded-2xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:text-[#00ADEF] transition-colors"
              >
                <Minus size={20} />
              </button>
              <span className="w-12 text-center font-bold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 hover:text-[#00ADEF] transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Bouton ajouter */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 bg-[#1E3A8A] hover:bg-[#00ADEF] text-white py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50 shadow-lg shadow-[#1E3A8A]/20"
            >
              <ShoppingCart size={22} />
              <span>Ajouter • {(product.price * quantity).toLocaleString()} F</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
