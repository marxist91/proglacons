'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase, db } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Product, CartItem, Order, Driver, Profile, AppNotification } from '@/types';
import { PRODUCTS } from '@/constants';

interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  neighborhood?: string;
  role: string;
}

interface AppContextType {
  // Auth
  session: any;
  user: AuthUser | null;
  userProfile: Profile | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string; neighborhood?: string }) => Promise<void>;
  logout: () => void;
  
  // Data
  products: Product[];
  orders: Order[];
  drivers: Driver[];
  profiles: Profile[];
  isLoading: boolean;
  
  // Cart
  cartItems: CartItem[];
  isCartOpen: boolean;
  addToCart: (product: Product) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  
  // Favorites
  favorites: string[];
  toggleFavorite: (product: Product) => void;
  favoriteProducts: Product[];
  
  // Notifications
  notifications: AppNotification[];
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  
  // Actions
  fetchData: () => Promise<void>;
  createOrder: (orderData: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Charger le panier depuis localStorage au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('proglacons_cart');
      if (savedCart) {
        try { 
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) setCartItems(parsed); 
        } catch (e) {}
      }
    }
  }, []);

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (cartItems.length > 0) {
        localStorage.setItem('proglacons_cart', JSON.stringify(cartItems));
      } else {
        localStorage.removeItem('proglacons_cart');
      }
    }
  }, [cartItems]);

  // Vérifier le token au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFavs = localStorage.getItem('proglacons_favorites');
      if (savedFavs) {
        try { setFavorites(JSON.parse(savedFavs)); } catch (e) {}
      }
    }

    // Vérifier si un token existe et récupérer le profil
    const token = api.getToken();
    if (token) {
      api.getProfile()
        .then((profile) => {
          setUser(profile);
          setUserProfile(profile as any);
        })
        .catch(() => {
          // Token invalide, le supprimer
          api.logout();
        });
    }

    // Aussi écouter les changements Supabase (pour compatibilité)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else if (!user) setUserProfile(null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Auth functions - Utiliser Supabase Auth directement
  const login = async (email: string, password: string) => {
    try {
      // Essayer d'abord l'API NestJS
      const response = await api.login(email, password);
      setUser(response.user);
      setUserProfile(response.user as any);
    } catch (error) {
      // Fallback sur Supabase Auth si l'API n'est pas disponible
      console.log('API indisponible, utilisation de Supabase Auth');
      const { data, error: supaError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (supaError) throw supaError;
      
      if (data.user) {
        setSession(data.session);
        await fetchUserProfile(data.user.id);
      }
    }
  };

  const register = async (data: { email: string; password: string; fullName: string; phone?: string; neighborhood?: string }) => {
    try {
      // Essayer d'abord l'API NestJS
      await api.register(data);
    } catch (error) {
      // Fallback sur Supabase Auth
      console.log('API indisponible, utilisation de Supabase Auth');
      const { data: authData, error: supaError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            neighborhood: data.neighborhood,
          }
        }
      });
      
      if (supaError) throw supaError;
      
      // Créer le profil dans la table profiles
      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: data.fullName,
          phone: data.phone || '',
          role: 'client',
        });
      }
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setUserProfile(null);
    setSession(null);
    // Vider le panier lors de la déconnexion
    setCartItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('proglacons_cart');
    }
    // Aussi déconnecter de Supabase
    supabase.auth.signOut();
  };

  const toggleFavorite = (product: Product) => {
    setFavorites(prev => {
      const newFavs = prev.includes(product.id) 
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id];
      if (typeof window !== 'undefined') {
        localStorage.setItem('proglacons_favorites', JSON.stringify(newFavs));
      }
      return newFavs;
    });
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await db.profiles.get(userId);
      // Ajouter l'email depuis la session si pas dans le profil
      const { data: { session } } = await supabase.auth.getSession();
      if (profile && session?.user?.email) {
        profile.email = session.user.email;
      }
      setUserProfile(profile);
      // Aussi mettre à jour user avec l'email
      if (session?.user) {
        setUser({
          ...profile,
          id: session.user.id,
          email: session.user.email || '',
        } as any);
      }
    } catch (err) { console.warn('Profil non trouvé'); }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prod, ord, driv, prof] = await Promise.allSettled([
        db.products.getAll(), db.orders.getAll(), db.drivers.getAll(), db.profiles.getAll()
      ]);
      setProducts(prod.status === 'fulfilled' ? prod.value : PRODUCTS);
      setOrders(ord.status === 'fulfilled' ? ord.value : []);
      setDrivers(driv.status === 'fulfilled' ? driv.value : []);
      setProfiles(prof.status === 'fulfilled' ? prof.value : []);
    } catch (err) { setProducts(PRODUCTS); }
    finally { setIsLoading(false); }
  };

  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, title, message, type, timestamp: new Date() }, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 8000);
  };

  // Protection contre les notifications en double
  const notificationHistory = useRef<Set<string>>(new Set());

  const addNotificationOnce = (key: string, title: string, message: string, type: AppNotification['type'] = 'info', cooldownMs: number = 10000) => {
    if (notificationHistory.current.has(key)) return;
    
    notificationHistory.current.add(key);
    addNotification(title, message, type);
    
    setTimeout(() => {
      notificationHistory.current.delete(key);
    }, cooldownMs);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('global-changes')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'orders' }, (p: any) => {
        // Mettre à jour seulement les commandes au lieu de tout recharger
        if (p.eventType === 'INSERT') {
          setOrders(prev => [p.new, ...prev]);
        } else if (p.eventType === 'UPDATE') {
          setOrders(prev => prev.map(order => order.id === p.new.id ? p.new : order));
        } else if (p.eventType === 'DELETE') {
          setOrders(prev => prev.filter(order => order.id !== p.old.id));
        }
        
        // Admin notification for new orders
        if (p.eventType === 'INSERT' && userProfile?.role === 'admin') {
          audioRef.current?.play().catch(() => {});
          addNotificationOnce(`admin-new-order-${p.new.id}-${Date.now()}`, '🆕 Nouvelle Commande', `De ${p.new.full_name || 'Client'} - ${p.new.total?.toLocaleString() || 0} FCFA`, 'success', 15000);
        }
        
        // Admin notification for delivered orders
        if (p.eventType === 'UPDATE' && userProfile?.role === 'admin' && p.new.status === 'Livré' && p.old?.status !== 'Livré') {
          audioRef.current?.play().catch(() => {});
          const confirmedBy = p.new.confirmed_by === 'client' ? 'par le client' : p.new.confirmed_by === 'driver' ? 'par le livreur' : 'par l\'admin';
          addNotificationOnce(`admin-delivered-${p.new.id}-${Date.now()}`, '✅ Commande Livrée!', `${p.new.full_name || 'Client'} - Confirmé ${confirmedBy}`, 'success', 15000);
        }
        
        // Admin notification when driver arrives
        if (p.eventType === 'UPDATE' && userProfile?.role === 'admin' && p.new.status === 'En attente de confirmation' && p.old?.status !== 'En attente de confirmation') {
          addNotificationOnce(`admin-driver-arrived-${p.new.id}-${Date.now()}`, '📍 Livreur Arrivé', `${p.new.full_name || 'Client'} - En attente de confirmation`, 'info', 15000);
        }
        
        // Client notification for order status updates
        // Vérifier si c'est une commande de l'utilisateur connecté (par user_id ou phone)
        const isUserOrder = p.new.user_id === (session?.user?.id || user?.id) || 
                           (userProfile?.phone && p.new.phone === userProfile.phone);
        
        if (p.eventType === 'UPDATE' && isUserOrder && userProfile?.role !== 'admin') {
          const status = p.new.status;
          const oldStatus = p.old?.status;
          
          // DEBUG: Log all updates to understand what's happening
          console.log(`🔄 Order update:`, {
            orderId: p.new.id,
            oldStatus,
            newStatus: status,
            statusChanged: status !== oldStatus,
            timestamp: new Date().toISOString()
          });
          
          // Ne notifier QUE si le statut passe exactement à "Livraison en cours" depuis un autre statut
          if (status === 'Livraison en cours' && oldStatus !== 'Livraison en cours') {
            console.log(`🚚 Triggering delivery notification for order ${p.new.id}`);
            audioRef.current?.play().catch(() => {});
            addNotificationOnce(`delivery-started-${p.new.id}`, '🚚 Livreur en Route!', 'Votre commande est en cours de livraison. Suivez-la en temps réel!', 'info', 60000); // 1 minute cooldown
          } else if (status === 'En attente de confirmation' && oldStatus !== 'En attente de confirmation') {
            audioRef.current?.play().catch(() => {});
            addNotificationOnce(`driver-arrived-${p.new.id}`, '📍 Livreur Arrivé!', `Donnez le code ${p.new.delivery_code || ''} au livreur pour confirmer`, 'warning', 60000);
          } else if (status === 'Livré' && oldStatus !== 'Livré') {
            audioRef.current?.play().catch(() => {});
            addNotificationOnce(`order-delivered-${p.new.id}`, '✅ Commande Livrée!', 'Merci pour votre commande! À bientôt 🧊', 'success', 60000);
          } else if (status === 'Préparation' && oldStatus !== 'Préparation') {
            addNotificationOnce(`order-preparing-${p.new.id}`, '📦 Commande en Préparation', 'Votre commande est en cours de préparation!', 'info', 60000);
          }
        }
      })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'products' }, (p: any) => {
        // Mettre à jour seulement les produits au lieu de tout recharger
        if (p.eventType === 'INSERT') {
          setProducts(prev => [p.new, ...prev]);
        } else if (p.eventType === 'UPDATE') {
          setProducts(prev => prev.map(product => product.id === p.new.id ? p.new : product));
        } else if (p.eventType === 'DELETE') {
          setProducts(prev => prev.filter(product => product.id !== p.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile, session, user]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: i.quantity + delta} : i).filter(i => i.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const createOrder = async (orderData: any) => {
    const userId = session?.user?.id || user?.id || null;
    
    // Format pour Supabase - arrondir total car c'est un integer dans la DB
    const newOrder: Record<string, unknown> = {
      full_name: String(orderData.name || ''), 
      phone: String(orderData.phone || ''), 
      address: String(orderData.address || ''),
      neighborhood: String(orderData.neighborhood || ''), 
      delivery_fee: Math.round(Number(orderData.deliveryFee) || 0),
      total: Math.round(Number(orderData.total) || 0), // Arrondir car integer dans Supabase
      items: cartItems,
      status: 'En attente'
    };
    
    // Ajouter user_id seulement si l'utilisateur est connecté
    if (userId) {
      newOrder.user_id = userId;
    }
    
    // Ajouter payment_method seulement si défini
    if (orderData.paymentMethod) {
      newOrder.payment_method = String(orderData.paymentMethod);
    }
    
    console.log('Création de commande:', newOrder);
    
    // Appel direct à Supabase
    const { data: createdOrder, error } = await supabase
      .from('orders')
      .insert(newOrder)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur Supabase:', error);
      console.error('Erreur détaillée:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'Erreur lors de la création de la commande');
    }
    
    // Ajouter les points de fidélité si l'utilisateur est connecté
    if (userId && createdOrder?.id) {
      try {
        const loyaltyResult = await db.loyalty.addPointsFromOrder(userId, createdOrder.id, orderData.total);
        if (loyaltyResult) {
          const earnedPoints = Math.floor((orderData.total / 1000) * 10 * db.loyalty.getTierMultiplier(loyaltyResult.tier));
          if (earnedPoints > 0) {
            addNotification('🎉 Points Fidélité', `Vous avez gagné ${earnedPoints} points!`, 'success');
          }
        }
      } catch (error) {
        console.error('Error adding loyalty points:', error);
        // Ne pas bloquer la commande si les points échouent
      }
    }
    
    await fetchData(); 
    clearCart();
    addNotification('Succès', 'Commande enregistrée', 'success');
  };

  const isAdmin = userProfile?.role === 'admin' || user?.role === 'admin';
  const isAuthenticated = !!(user || session);
  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <AppContext.Provider value={{
      session, user, userProfile, isAdmin, isAuthenticated,
      login, register, logout,
      products, orders, drivers, profiles, isLoading,
      cartItems, isCartOpen, addToCart, updateCartQuantity, removeFromCart, clearCart, setIsCartOpen,
      favorites, toggleFavorite, favoriteProducts,
      notifications, addNotification,
      fetchData, createOrder
    }}>
      <audio ref={audioRef} src='https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' preload='auto' />
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
