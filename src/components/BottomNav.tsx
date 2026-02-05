'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Truck, User, Search } from 'lucide-react';
import { useApp } from '@/lib/context';
import { useTheme } from '@/lib/theme';

const BottomNav = () => {
  const pathname = usePathname();
  const { cartItems } = useApp();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const cartCount = cartItems.reduce((a, b) => a + b.quantity, 0);

  const navItems = [
    { label: 'Accueil', href: '/', icon: Home },
    { label: 'Boutique', href: '/catalog', icon: ShoppingBag },
    { label: 'Recherche', href: '/search', icon: Search },
    { label: 'Suivi', href: '/tracking', icon: Truck },
    { label: 'Profil', href: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
      <div className={`backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border px-4 py-3 flex justify-between items-center relative overflow-hidden ${
        isDark 
          ? 'bg-slate-900/80 border-slate-700/50'
          : 'bg-white/80 border-white/50'
      }`}>
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-[#00ADEF]' : isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 bg-[#00ADEF] rounded-full"></div>
              )}
              
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {item.href === '/catalog' && cartCount > 0 && (
                   <span className={`absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-2 ${
                     isDark ? 'ring-slate-900' : 'ring-white'
                   }`}>
                     {cartCount > 9 ? '9+' : cartCount}
                   </span>
                )}
              </div>
              
              <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-0 scale-50'} transition-all`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
