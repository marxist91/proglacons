'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, Snowflake, User, Truck, LogIn, LogOut, ChevronDown, Settings, Bell, Search, MapPin } from 'lucide-react';
import { useApp } from '@/lib/context';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/lib/theme';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { cartItems, setIsCartOpen, isAuthenticated, user, userProfile, logout, isAdmin } = useApp();
  const { resolvedTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const isDark = resolvedTheme === 'dark';

  const cartCount = cartItems.reduce((a, b) => a + b.quantity, 0);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const userName = user?.full_name || userProfile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';

  const navLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Catalogue', href: '/catalog' },
    { label: 'Services', href: '/services' },
    { label: 'Suivi', href: '/tracking', icon: Truck },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
      scrolled 
        ? isDark
          ? 'py-3 bg-slate-900/95 backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]'
          : 'py-3 bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]' 
        : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-2 bg-[#00ADEF]/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-[#00ADEF] p-2.5 rounded-xl shadow-lg shadow-[#00ADEF]/20 transform group-hover:rotate-12 transition-transform duration-500">
                <Snowflake className="text-white w-6 h-6" />
              </div>
            </div>
            <div className="flex flex-col -space-y-1">
              <span className={`text-2xl font-[900] tracking-tighter leading-none transition-colors ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>PRO</span>
              <span className="text-2xl font-[900] tracking-tighter text-[#00ADEF] leading-none">GLAÇONS</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className={`hidden md:flex items-center p-1.5 rounded-2xl border shadow-inner ${
            isDark 
              ? 'bg-slate-800/50 backdrop-blur-md border-slate-700/50'
              : 'bg-slate-100/30 backdrop-blur-md border-slate-200/50'
          }`}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-6 py-2.5 text-sm font-black transition-all duration-300 rounded-xl ${
                  isActive(link.href) 
                    ? 'text-white' 
                    : isDark 
                      ? 'text-slate-300 hover:text-[#00ADEF]'
                      : 'text-slate-600 hover:text-[#00ADEF]'
                }`}
              >
                {isActive(link.href) && (
                   <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] to-[#00ADEF] rounded-xl -z-10 shadow-lg shadow-blue-200/50 animate-in fade-in zoom-in-95 duration-300"></div>
                )}
                {link.icon && <link.icon className={`w-4 h-4 ${isActive(link.href) ? 'text-white' : 'text-slate-400'}`} />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle - Desktop */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              data-tour="cart"
              aria-label={`Panier, ${cartCount} articles`}
              className={`relative group flex items-center gap-2 px-4 py-2.5 rounded-full border-2 shadow-sm transition-all transform active:scale-95 ${
                isDark
                  ? 'border-slate-700 bg-slate-800 hover:border-[#00ADEF]'
                  : 'border-slate-100 bg-white hover:border-[#00ADEF]'
              }`}
            >
              <ShoppingCart className={`w-5 h-5 group-hover:text-[#00ADEF] transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in">
                  {cartCount}
                </span>
              )}
              <span className={`hidden sm:inline text-sm font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Panier</span>
            </button>

            <div className={`w-px h-8 mx-1 hidden sm:block ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

            {/* Auth/User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 p-1 pr-4 rounded-full transition-all border ${
                    isDark 
                      ? 'bg-slate-800/50 hover:bg-slate-700 border-slate-700'
                      : 'bg-slate-100/50 hover:bg-slate-100 border-slate-200/50'
                  }`}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-[#1E3A8A] to-[#00ADEF] rounded-full flex items-center justify-center shadow-md border-2 border-white">
                    <span className="text-white font-[900] text-sm">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </button>

                {/* Modern Dropdown */}
                {isUserMenuOpen && (
                  <div className={`absolute right-0 mt-3 w-64 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border py-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300 ${
                    isDark
                      ? 'bg-slate-800/95 border-slate-700'
                      : 'bg-white/95 border-slate-100'
                  }`}>
                    <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-50'}`}>
                      <p className={`text-sm font-black leading-tight mb-0.5 ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>{userName}</p>
                      <p className="text-xs text-slate-400 font-medium truncate">{user?.email}</p>
                    </div>
                    
                    <div className="p-2">
                       <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
                          isDark 
                            ? 'text-slate-300 hover:bg-slate-700 hover:text-[#00ADEF]'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-[#00ADEF]'
                        }`}
                      >
                        <User className="w-4.5 h-4.5" />
                        Mon Profil
                      </Link>
                      
                      <Link
                        href="/tracking"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
                          isDark 
                            ? 'text-slate-300 hover:bg-slate-700 hover:text-[#00ADEF]'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-[#00ADEF]'
                        }`}
                      >
                        <Truck className="w-4.5 h-4.5" />
                        Suivre mes colis
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all mt-1 ${
                            isDark
                              ? 'text-[#00ADEF] bg-blue-900/30 hover:bg-blue-900/50'
                              : 'text-[#1E3A8A] bg-blue-50/50 hover:bg-blue-50'
                          }`}
                        >
                          <Settings className="w-4.5 h-4.5" />
                          Administration
                        </Link>
                      )}
                    </div>
                    
                    <div className={`px-2 mt-2 pt-2 border-t ${isDark ? 'border-slate-700' : 'border-slate-50'}`}>
                      <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all w-full ${
                          isDark
                            ? 'text-red-400 hover:bg-red-900/30'
                            : 'text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <LogOut className="w-4.5 h-4.5" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/auth"
                className="group flex items-center gap-2 px-6 py-3 rounded-full bg-[#1E3A8A] hover:bg-[#00ADEF] transition-all text-sm font-black text-white shadow-lg shadow-[#1E3A8A]/20 transform active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Connexion</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-3 rounded-2xl ${
                isDark 
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-[#1E3A8A]'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden absolute top-full left-0 right-0 backdrop-blur-2xl border-t shadow-2xl animate-in slide-in-from-top-4 duration-300 ${
          isDark 
            ? 'bg-slate-900/95 border-slate-800'
            : 'bg-white/95 border-slate-100'
        }`}>
          <div className="p-6 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 p-5 rounded-[1.5rem] text-lg font-black transition-all ${
                  isActive(link.href) 
                    ? isDark
                      ? 'bg-blue-900/30 text-[#00ADEF] shadow-inner'
                      : 'bg-blue-50 text-[#00ADEF] shadow-inner' 
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.icon && <link.icon className="w-6 h-6" />}
                {link.label}
              </Link>
            ))}
            
            <div className={`pt-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
               <Link 
                href="/catalog"
                 onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-3 w-full bg-[#1E3A8A] text-white p-5 rounded-[1.5rem] text-lg font-black shadow-xl hover:bg-[#00ADEF] transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                Boutique en ligne
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
