'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, IceCream, Clock, ShieldCheck, Snowflake, ArrowRight, Star } from 'lucide-react';
import { useTheme } from '@/lib/theme';

const Hero = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const snowflakes = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 20}s`,
    duration: `${15 + Math.random() * 20}s`,
    size: 12 + Math.random() * 20,
    opacity: 0.05 + Math.random() * 0.1,
  }));

  return (
    <section className={`relative min-h-[90vh] flex items-center pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden transition-colors ${
      isDark ? 'bg-slate-900' : 'bg-white'
    }`}>
      {/* Decorative Background Elements */}
      <div className={`absolute top-0 right-0 w-[50%] h-[50%] rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2 ${
        isDark ? 'bg-[#00ADEF]/10' : 'bg-[#00ADEF]/5'
      }`}></div>
      <div className={`absolute bottom-0 left-0 w-[30%] h-[30%] rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2 ${
        isDark ? 'bg-[#1E3A8A]/10' : 'bg-[#1E3A8A]/5'
      }`}></div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute animate-fall"
            style={{
              left: flake.left,
              animationDelay: flake.delay,
              animationDuration: flake.duration,
              top: '-50px',
            }}
          >
            <div className="animate-drift" style={{ animationDuration: '4s' }}>
              <Snowflake
                size={flake.size}
                style={{ opacity: isDark ? flake.opacity * 1.5 : flake.opacity }}
                className="text-[#00ADEF]"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <div className="mb-12 lg:mb-0">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-left-4 duration-700 ${
              isDark ? 'bg-blue-900/50 text-[#00ADEF]' : 'bg-blue-50 text-[#00ADEF]'
            }`}>
              <span className="flex h-2 w-2 rounded-full bg-[#00ADEF] animate-pulse"></span>
              Disponible 24h/24 à Lomé
            </div>
            
            <h1 className={`text-6xl lg:text-8xl font-black leading-[0.95] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 ${
              isDark ? 'text-white' : 'text-[#1E3A8A]'
            }`}>
              La Fraîcheur <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ADEF] to-[#1E3A8A]">
                Sans Limites.
              </span>
            </h1>
            
            <p className={`text-xl mb-10 max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Fini les boissons tièdes. Recevez vos sacs de glaçons alimentaires purs en moins de 45 minutes, partout à Lomé.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Link 
                href="/catalog"
                className="inline-flex items-center justify-center gap-3 bg-[#1E3A8A] text-white px-10 py-5 rounded-2xl font-black text-lg hover:shadow-[0_20px_50px_rgba(30,58,138,0.3)] hover:-translate-y-1 transition-all active:scale-95 group"
              >
                Commander maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="tel:+22879747575" 
                className={`inline-flex items-center justify-center gap-3 border-2 px-10 py-5 rounded-2xl font-black text-lg transition-all active:scale-95 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-blue-900/50' : 'bg-blue-50'
                }`}>
                  <Clock className="w-4 h-4 text-[#00ADEF]" />
                </div>
                79 74 75 75
              </a>
            </div>

            <div className="mt-16 flex items-center gap-10 animate-in fade-in duration-1000 delay-500">
               <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-12 h-12 rounded-full border-4 overflow-hidden ${
                      isDark ? 'border-slate-800 bg-slate-700' : 'border-white bg-slate-200'
                    }`}>
                       <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                    </div>
                  ))}
               </div>
               <div>
                  <div className="flex text-amber-400 mb-1">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>2,000+ Clients satisfaits</p>
               </div>
            </div>
          </div>

          <div className="relative animate-in fade-in zoom-in duration-1000">
            {/* Visual Glass Card Bottom */}
            <div className={`absolute -bottom-10 -left-10 z-20 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border hidden lg:block max-w-[280px] ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700/50'
                : 'bg-white/80 border-white/50'
            }`}>
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Certifié</p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>Glace Alimentaire</p>
                  </div>
               </div>
               <p className={`text-xs leading-relaxed italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                 "La meilleure qualité de glace que j'ai pu trouver à Lomé pour mon restaurant."
               </p>
            </div>

            {/* Main Image Container */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#00ADEF]/20 to-[#1E3A8A]/20 blur-3xl rounded-[4rem] group-hover:opacity-100 transition-opacity"></div>
              <div className={`relative aspect-square md:aspect-[4/5] rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] border-8 group-hover:scale-[1.02] transition-transform duration-700 ${
                isDark ? 'border-slate-800 bg-slate-800' : 'border-white bg-white'
              }`}>
                <img 
                  src="/images/IMG_0554.jpg"
                  alt="PRO-GLAÇONS - Glace de qualité" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute -top-6 -right-6 bg-[#00ADEF] text-white p-6 rounded-3xl shadow-2xl transform rotate-12 animate-float">
               <Snowflake className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>Découvrir</span>
        <div className={`w-px h-12 bg-gradient-to-b to-transparent ${isDark ? 'from-white' : 'from-[#1E3A8A]'}`}></div>
      </div>
    </section>
  );
};

export default Hero;
