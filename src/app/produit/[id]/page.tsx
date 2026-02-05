'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Minus, Plus, ChevronLeft, Share2, Truck, Clock, Shield, Star } from 'lucide-react';
import { Product } from '@/types';
import { useApp } from '@/lib/context';
import { useTheme } from '@/lib/theme';
import { useHaptics } from '@/hooks/useHaptics';
import ProductReviews, { StarRating } from '@/components/ProductReviews';
import SocialShare from '@/components/SocialShare';
import BottomNav from '@/components/BottomNav';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { products, addToCart, favorites, toggleFavorite, setIsCartOpen } = useApp();
  const { resolvedTheme } = useTheme();
  const { haptics } = useHaptics();
  const isDark = resolvedTheme === 'dark';
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [imageLoaded, setImageLoaded] = useState(false);

  const productId = params.id as string;
  const product = products.find(p => p.id === productId);
  const isFavorite = product ? favorites.includes(product.id) : false;

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    haptics.addToCart();
    setIsCartOpen(true);
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    toggleFavorite(product);
    haptics.toggleFavorite();
  };

  const handleBack = () => {
    // Retourner au catalogue directement
    router.push('/catalogue');
  };

  if (!product) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00ADEF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} pb-32`}>
      {/* Header fixe - BOUTON RETOUR */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800" style={{ zIndex: 99999 }}>
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <a
            href="/catalog"
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-[#00ADEF] transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 no-underline"
          >
            <ChevronLeft size={24} />
            <span className="font-medium">Retour</span>
          </a>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleFavorite}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isFavorite
                  ? 'bg-red-500 text-white'
                  : `${isDark ? 'bg-slate-800' : 'bg-white'} text-slate-500 hover:text-red-500`
              }`}
            >
              <Heart size={22} className={isFavorite ? 'fill-current' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="pt-20 max-w-4xl mx-auto">
        
        {/* GRANDE IMAGE - Pleine largeur */}
        <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} mx-4 rounded-3xl overflow-hidden shadow-xl`}>
          <div className="relative">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 animate-pulse" />
            )}
            <img
              src={product.imageUrl}
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-auto object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Tag promo */}
            {product.tag && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-[#1E3A8A] to-[#00ADEF] text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg">
                {product.tag}
              </div>
            )}
          </div>
        </div>

        {/* Infos produit */}
        <div className={`mx-4 mt-6 p-6 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl shadow-lg`}>
          {/* Catégorie */}
          <p className="text-sm font-bold text-[#00ADEF] uppercase tracking-widest mb-2">
            {product.category}
          </p>
          
          {/* Nom */}
          <h1 className="text-3xl md:text-4xl font-black text-[#1E3A8A] dark:text-white mb-4">
            {product.name}
          </h1>
          
          {/* Note */}
          <div className="flex items-center gap-3 mb-6">
            <StarRating rating={4.7} size={20} />
            <span className="text-slate-500 font-medium">(156 avis)</span>
          </div>
          
          {/* Prix */}
          <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
            <span className="text-5xl md:text-6xl font-black text-[#1E3A8A] dark:text-white">
              {product.price.toLocaleString()}
            </span>
            <span className="text-xl text-slate-400 font-bold">FCFA / {product.unit}</span>
          </div>

          {/* Avantages */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-blue-50'}`}>
                <Truck size={24} className="text-[#00ADEF]" />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Livraison rapide</p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-blue-50'}`}>
                <Clock size={24} className="text-[#00ADEF]" />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">15-45 min</p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-blue-50'}`}>
                <Shield size={24} className="text-[#00ADEF]" />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Qualité garantie</p>
            </div>
          </div>

          {/* Partage */}
          <SocialShare product={product} />
        </div>

        {/* Tabs */}
        <div className={`mx-4 mt-6 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl shadow-lg overflow-hidden`}>
          <div className="flex border-b border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-4 font-bold text-center transition-colors ${
                activeTab === 'details'
                  ? 'text-[#00ADEF] bg-blue-50 dark:bg-slate-700'
                  : 'text-slate-400'
              }`}
            >
              Détails
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-4 font-bold text-center transition-colors ${
                activeTab === 'reviews'
                  ? 'text-[#00ADEF] bg-blue-50 dark:bg-slate-700'
                  : 'text-slate-400'
              }`}
            >
              Avis clients
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  {product.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-5 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <p className="text-xs text-slate-400 uppercase mb-1">Disponibilité</p>
                    <p className="font-bold text-xl text-[#1E3A8A] dark:text-white">
                      {product.inStock ? `${product.stock_quantity} en stock` : 'Rupture de stock'}
                    </p>
                  </div>
                  <div className={`p-5 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <p className="text-xs text-slate-400 uppercase mb-1">Unité</p>
                    <p className="font-bold text-xl text-[#1E3A8A] dark:text-white">
                      {product.unit}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <ProductReviews productId={product.id} productName={product.name} />
            )}
          </div>
        </div>
      </div>

      {/* Barre d'action fixe en bas */}
      <div className={`fixed bottom-0 left-0 right-0 ${isDark ? 'bg-slate-900' : 'bg-white'} border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} p-4 z-[100]`}>
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          {/* Sélecteur quantité */}
          <div className={`flex items-center rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-4 hover:text-[#00ADEF] transition-colors relative z-10"
            >
              <Minus size={22} />
            </button>
            <span className="w-14 text-center font-bold text-xl">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-4 hover:text-[#00ADEF] transition-colors relative z-10"
            >
              <Plus size={22} />
            </button>
          </div>

          {/* Bouton ajouter */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="flex-1 bg-[#1E3A8A] hover:bg-[#00ADEF] text-white py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl relative z-10"
          >
            <ShoppingCart size={24} />
            <span>Ajouter • {(product.price * quantity).toLocaleString()} FCFA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
