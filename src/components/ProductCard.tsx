'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Zap, Plus, Snowflake } from 'lucide-react';
import { Product } from '@/types';
import { useApp } from '@/lib/context';
import { useTheme } from '@/lib/theme';
import { useHaptics } from '@/hooks/useHaptics';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const { addToCart, favorites, toggleFavorite } = useApp();
  const { resolvedTheme } = useTheme();
  const { haptics } = useHaptics();
  const isDark = resolvedTheme === 'dark';
  const isFavorite = favorites.includes(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    haptics.addToCart();
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product);
    haptics.toggleFavorite();
  };

  const handleOpenDetail = () => {
    haptics.buttonPress();
    router.push(`/produit/${product.id}`);
  };

  return (
    <div className={`group rounded-[2.5rem] overflow-hidden shadow-lg transition-all duration-500 border flex flex-col hover:shadow-2xl translate-y-0 hover:-translate-y-1 ${
      isDark 
        ? 'bg-slate-800 shadow-slate-900/50 hover:shadow-[#00ADEF]/10 border-slate-700'
        : 'bg-white shadow-slate-100/50 hover:shadow-[#1E3A8A]/10 border-slate-100'
    }`}>
      <div className={`relative aspect-[4/5] overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <img 
          src={product.imageUrl} 
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-110 will-change-transform transform-gpu"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {product.tag && (
          <div className="absolute top-5 left-5 bg-white/10 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl">
            <Zap size={12} className="fill-yellow-400 stroke-yellow-400" />
            {product.tag}
          </div>
        )}
        
        <button 
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
          aria-pressed={isFavorite}
          className={`absolute top-5 right-5 w-11 h-11 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 shadow-xl z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADEF] ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 backdrop-blur-sm text-slate-400 hover:text-red-500 hover:bg-white'
          }`}
        >
          <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
        </button>

        {!product.inStock && (
          <div className="absolute inset-0 bg-[#1E3A8A]/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-md text-[#1E3A8A] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transform -rotate-3">
              Indisponible
            </div>
          </div>
        )}

        {/* Quick Add Overlay (Desktop) */}
        <div className="absolute inset-x-5 bottom-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out hidden lg:block z-20">
           <button 
            onClick={handleAddToCart}
            disabled={!product.inStock}
            aria-label={`Ajouter ${product.name} au panier`}
            className="w-full bg-white/90 backdrop-blur-md text-[#1E3A8A] py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl hover:bg-white transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADEF]"
           >
             <Plus className="w-5 h-5" />
             Ajouter au panier
           </button>
        </div>
      </div>

      <div className="p-7 flex flex-col flex-1">
        <div className="mb-5 flex-1">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00ADEF]"></div>
             <p className="text-[10px] font-black text-[#00ADEF] uppercase tracking-[0.2em]">
                {product.category}
             </p>
          </div>
          <h3 className={`text-xl font-black mb-2 leading-tight group-hover:text-[#00ADEF] transition-colors ${
            isDark ? 'text-white' : 'text-[#1E3A8A]'
          }`}>
            {product.name}
          </h3>
          <p className={`text-sm leading-relaxed line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {product.description}
          </p>
        </div>

        <div className={`flex items-end justify-between pt-5 border-t ${isDark ? 'border-slate-700' : 'border-slate-50'}`}>
          <div className="space-y-0.5">
            <p className={`text-[10px] font-black uppercase tracking-widest ml-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Prix par {product.unit}
            </p>
            <div className="flex items-baseline gap-1">
               <span className={`text-2xl font-[900] ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>{product.price.toLocaleString()}</span>
               <span className={`text-xs font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>FCFA</span>
            </div>
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={!product.inStock}
            aria-label={`Ajouter ${product.name} au panier`}
            className="lg:hidden bg-[#1E3A8A] hover:bg-[#00ADEF] text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#1E3A8A]/20 transform active:scale-90 z-20 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADEF]"
          >
            <ShoppingCart size={20} />
          </button>

          {/* Icon indicator for desktop that changes when in stock */}
          <div className={`hidden lg:flex w-10 h-10 items-center justify-center rounded-2xl transition-all duration-500 ${
            isDark 
              ? 'bg-slate-700 text-[#00ADEF] group-hover:bg-[#00ADEF] group-hover:text-white'
              : 'bg-slate-50 text-[#1E3A8A] group-hover:bg-[#1E3A8A] group-hover:text-white'
          }`}>
             <Snowflake className={`w-5 h-5 ${product.inStock ? 'animate-pulse' : 'opacity-20'}`} />
          </div>
        </div>
      </div>

      {/* Overlay cliquable pour voir les détails */}
      <button
        onClick={handleOpenDetail}
        className="absolute inset-0 z-10 opacity-0"
        aria-label="Voir les détails du produit"
      />
    </div>
  );
};

export default ProductCard;
