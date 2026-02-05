'use client';

import React, { useState, useMemo } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import { Search, Filter, Star, Sparkles, PackageOpen, LayoutGrid, ListFilter, Zap } from 'lucide-react';
import { useApp } from '@/lib/context';
import { useTheme } from '@/lib/theme';

const CATEGORIES = ['Tous', 'Glaçons', 'Ice Cup', 'Carbo Glace', 'Pack'];

export default function CatalogPage() {
  const { products } = useApp();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyBestPrice, setOnlyBestPrice] = useState(false);

  const promoProducts = useMemo(() => {
    return products.filter(p => 
      p.tag === 'Offre Spéciale' || 
      p.price < 1000 || 
      p.tag === 'Meilleur Prix' || 
      p.tag === 'Populaire'
    ).slice(0, 4); 
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesCat = activeCategory === 'Tous' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBest = !onlyBestPrice || p.price < 1000 || p.tag === 'Populaire' || p.tag === 'Offre Spéciale' || p.tag === 'Meilleur Prix';
      return matchesCat && matchesSearch && matchesBest;
    });
  }, [products, activeCategory, searchQuery, onlyBestPrice]);

  return (
    <div className={`pt-32 pb-24 min-h-screen relative overflow-hidden transition-colors ${
      isDark ? 'bg-slate-900' : 'bg-white'
    }`}>
      {/* Background Decor */}
      <div className={`absolute top-0 right-0 w-1/3 h-1/3 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2 ${
        isDark ? 'bg-blue-900/30' : 'bg-blue-50/50'
      }`}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Breadcrumbs items={[{ label: 'Catalogue' }]} />
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mt-12 mb-16">
          <div className="max-w-2xl">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4 ${
              isDark ? 'bg-blue-900/50 text-[#00ADEF]' : 'bg-blue-50 text-[#00ADEF]'
            }`}>
              <Sparkles className="w-4 h-4 fill-current" />
              La Boutique Officielle
            </div>
            <h1 className={`text-5xl lg:text-7xl font-[900] leading-tight tracking-tighter ${
              isDark ? 'text-white' : 'text-[#1E3A8A]'
            }`}>
              Fraîcheur <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ADEF] to-[#1E3A8A]">Garantie.</span>
            </h1>
          </div>
          
          <div className="relative w-full max-w-md group">
            <div className="absolute -inset-1 bg-[#00ADEF]/20 rounded-[2rem] blur group-hover:bg-[#00ADEF]/30 transition-all"></div>
            <div className={`relative flex items-center border rounded-[1.5rem] overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[#00ADEF] transition-all ${
              isDark 
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            }`}>
              <Search className={`ml-5 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input 
                type="text" 
                placeholder="Ex: Glaçons sac 5kg..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className={`w-full px-4 py-5 outline-none font-medium bg-transparent ${
                  isDark 
                    ? 'placeholder:text-slate-500 text-white'
                    : 'placeholder:text-slate-400 text-slate-900'
                }`} 
              />
            </div>
          </div>
        </div>

        {/* Improved Filters */}
        <div className={`sticky top-24 z-30 backdrop-blur-xl -mx-4 px-4 py-4 mb-16 border-b shadow-sm md:shadow-none flex flex-wrap items-center gap-4 overflow-x-auto no-scrollbar ${
          isDark 
            ? 'bg-slate-900/80 border-slate-800/50'
            : 'bg-white/80 border-slate-100/50'
        }`}>
          <div className={`flex items-center gap-2 mr-2 font-black text-xs uppercase tracking-widest px-4 py-3 rounded-2xl ${
            isDark 
              ? 'text-white bg-slate-800'
              : 'text-[#1E3A8A] bg-slate-100'
          }`}>
            <ListFilter size={16} />
          </div>
          
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button 
                key={cat} 
                onClick={() => { setActiveCategory(cat); setOnlyBestPrice(false); }} 
                className={`px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap border-2 transform active:scale-95 ${
                  activeCategory === cat && !onlyBestPrice 
                  ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-xl shadow-blue-200' 
                  : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-[#00ADEF]/30 hover:text-[#00ADEF]'
                    : 'bg-white border-slate-100 text-slate-500 hover:border-[#00ADEF]/30 hover:text-[#00ADEF]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className={`w-px h-8 mx-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          
          <button 
            onClick={() => { setOnlyBestPrice(!onlyBestPrice); if (!onlyBestPrice) setActiveCategory('Tous'); }} 
            className={`px-6 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap border-2 active:scale-95 ${
              onlyBestPrice 
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-200' 
              : isDark
                ? 'bg-amber-900/30 border-amber-800 text-amber-500 hover:bg-amber-900/50'
                : 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100'
            }`}
          >
            <Star size={16} className={onlyBestPrice ? 'fill-current' : ''} /> 
            Meilleur Prix
          </button>
        </div>

        {activeCategory === 'Tous' && searchQuery === '' && !onlyBestPrice && promoProducts.length > 0 && (
          <div className="mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[#00ADEF] ${
                  isDark ? 'bg-blue-900/50' : 'bg-blue-50'
                }`}>
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div>
                  <h2 className={`text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>SÉLECTION PREMIUM</h2>
                  <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Les incontournables de la semaine</p>
                </div>
              </div>
            </div>
            
            <div className={`p-8 lg:p-12 rounded-[3.5rem] border ${
              isDark 
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-slate-50/50 border-slate-100'
            }`}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {promoProducts.map(p => (
                  <ProductCard key={`promo-${p.id}`} product={p} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
               <div className="w-2 h-8 bg-[#00ADEF] rounded-full"></div>
               <h3 className={`text-2xl font-black tracking-tighter flex items-center gap-3 ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>
                {onlyBestPrice ? 'Offres Spéciales' : activeCategory === 'Tous' ? 'Tout le catalogue' : activeCategory} 
                <span className="text-[#00ADEF] opacity-30">/</span>
                <span className="text-[#00ADEF] text-sm tabular-nums">{filtered.length} produits</span>
              </h3>
            </div>
            
            <div className="flex gap-2">
               <button className="p-2.5 bg-[#1E3A8A] text-white rounded-xl shadow-lg">
                  <LayoutGrid size={20} />
               </button>
            </div>
          </div>
          
          {filtered.length > 0 ? (
            <div data-tour="catalog" className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12" role="list" aria-label="Liste des produits">
              {filtered.map(p => (
                <div key={p.id} role="listitem">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className={`py-12 rounded-[4rem] border-4 border-dashed ${
              isDark 
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-slate-50/50 border-white'
            }`}>
              <EmptyState
                type="search"
                action={{
                  label: 'Tout réafficher',
                  onClick: () => { setActiveCategory('Tous'); setSearchQuery(''); setOnlyBestPrice(false); }
                }}
              />
            </div>
          )}
        </div>
        
        {/* Info Box Footer */}
        <div className="mt-32 p-10 lg:p-16 bg-[#1E3A8A] rounded-[3.5rem] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-[#00ADEF]/10 -skew-x-12 translate-x-10"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="max-w-xl text-center md:text-left">
                  <h4 className="text-3xl lg:text-4xl font-black mb-4">Besoin d'un gros volume ?</h4>
                  <p className="text-blue-100 font-medium opacity-80">Nos conseillers vous proposent des tarifs dégressifs pour vos mariages, soirées et besoins industriels.</p>
               </div>
               <a href="tel:+22879747575" className="px-10 py-5 bg-[#00ADEF] text-white rounded-2xl font-black text-lg hover:bg-white hover:text-[#00ADEF] transition-all shadow-2xl whitespace-nowrap active:scale-95">
                  Obtenir un devis
               </a>
            </div>
            <Zap className="absolute -left-4 -bottom-4 w-32 h-32 text-white/5 transform rotate-12" />
        </div>
      </div>
    </div>
  );
}
