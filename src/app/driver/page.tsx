
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Truck, Package, MapPin, Phone, CheckCircle2, 
  Navigation, AlertCircle, Loader2, LogOut, RefreshCw, 
  ChevronRight, Play, MessageCircle, Copy, Check,
  Snowflake, Home, User, Edit3, Save, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order, Driver } from '@/types';


type DriverStatus = 'Disponible' | 'En livraison' | 'Hors service';
type DriverTab = 'deliveries' | 'profile';

export default function DriverDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmationInput, setShowConfirmationInput] = useState(false);
  const [confirmationError, setConfirmationError] = useState('');
  
  // Profile states
  const [activeTab, setActiveTab] = useState<DriverTab>('deliveries');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Charger le livreur depuis localStorage
  useEffect(() => {
    const savedDriver = localStorage.getItem('proglacons_driver');
    if (savedDriver) {
      try {
        const parsed = JSON.parse(savedDriver);
        setDriver(parsed);
        setIsAuthenticated(true);
        setProfileForm({ name: parsed.name || '', phone: parsed.phone || '' });
      } catch {
        localStorage.removeItem('proglacons_driver');
      }
    }
    setIsLoading(false);
  }, []);

  // Charger les commandes assignées
  const fetchOrders = useCallback(async () => {
    if (!driver) return;
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', driver.id)
        .in('status', ['En attente', 'Préparation', 'Livraison en cours', 'En attente de confirmation'])
        .order('created_at', { ascending: false });
      if (!error && data) {
        setOrders(data);
        // Trouver la commande active (en cours de livraison ou en attente de confirmation)
        const active = data.find(o => o.status === 'Livraison en cours' || o.status === 'En attente de confirmation');
        setActiveOrder(active || null);
        // AUTOMATISATION : si une commande active existe et le statut n'est pas 'En livraison', on met à jour
        if (active && driver.status !== 'En livraison') {
          await updateDriverStatus('En livraison');
        }
        // Si aucune commande active et le statut est 'En livraison', repasser à 'Disponible'
        if (!active && driver.status === 'En livraison') {
          await updateDriverStatus('Disponible');
        }
      }
    } catch (err) {
      console.error('Erreur fetch orders:', err);
    }
    setIsRefreshing(false);
  }, [driver, driver?.status]);

  useEffect(() => {
    if (isAuthenticated && driver) {
      fetchOrders();
      
      // Polling toutes les 30 secondes
      const interval = setInterval(fetchOrders, 30000);
      
      // Realtime subscription
      const channel = supabase
        .channel('driver-orders')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `driver_id=eq.${driver.id}`
        }, () => {
          fetchOrders();
        })
        .subscribe();
      
      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, driver, fetchOrders]);

  // Connexion livreur
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    // Nettoyer le numéro (enlever espaces, tirets, etc.)
    const phoneClean = loginPhone.replace(/[\s\-\.]/g, '');

    try {
      // Essayer d'abord avec le numéro exact
      let { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('phone', phoneClean)
        .single();
      
      // Si pas trouvé, essayer avec le numéro original (avec espaces)
      if (error || !data) {
        const result = await supabase
          .from('drivers')
          .select('*')
          .eq('phone', loginPhone.trim())
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error || !data) {
        setLoginError('Numéro non reconnu. Contactez l\'administrateur.');
        setIsLoading(false);
        return;
      }

      setDriver(data);
      setIsAuthenticated(true);
      localStorage.setItem('proglacons_driver', JSON.stringify(data));
    } catch {
      setLoginError('Erreur de connexion. Vérifiez votre connexion internet.');
    }
    setIsLoading(false);
  };

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem('proglacons_driver');
    setDriver(null);
    setIsAuthenticated(false);
    setOrders([]);
    setActiveOrder(null);
  };

  // Sauvegarder le profil
  const handleSaveProfile = async () => {
    if (!driver) return;
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          name: profileForm.name,
          phone: profileForm.phone
        })
        .eq('id', driver.id);

      if (error) throw error;

      const updatedDriver = { ...driver, name: profileForm.name, phone: profileForm.phone };
      setDriver(updatedDriver);
      localStorage.setItem('proglacons_driver', JSON.stringify(updatedDriver));
      setProfileMessage({ type: 'success', text: '✅ Profil mis à jour!' });
      setIsEditingProfile(false);
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Changer le statut du livreur
  const updateDriverStatus = async (status: DriverStatus) => {
    if (!driver) return;
    
    try {
      await supabase
        .from('drivers')
        .update({ status })
        .eq('id', driver.id);
      
      setDriver({ ...driver, status });
      localStorage.setItem('proglacons_driver', JSON.stringify({ ...driver, status }));
    } catch (err) {
      console.error('Erreur update status:', err);
    }
  };

  // Démarrer une livraison
  const startDelivery = async (order: Order) => {
    try {
      await supabase
        .from('orders')
        .update({ status: 'Livraison en cours' })
        .eq('id', order.id);
      
      await updateDriverStatus('En livraison');
      setActiveOrder({ ...order, status: 'Livraison en cours' });
      
      // Démarrer le suivi GPS
      startLocationTracking(order.id);
      
      fetchOrders();
    } catch (err) {
      console.error('Erreur start delivery:', err);
    }
  };

  // Suivi GPS en temps réel
  const startLocationTracking = (orderId: string) => {
      console.log('startLocationTracking called', orderId);
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsTrackingLocation(true);
    setLocationError(null);

        const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Mettre à jour la position dans la commande
        try {
          await supabase
            .from('orders')
            .update({ 
              driver_latitude: latitude, 
              driver_longitude: longitude 
            })
            .eq('id', orderId);
          
          // Mettre à jour aussi le livreur
          if (driver) {
            await supabase
              .from('drivers')
              .update({ 
                latitude, 
                longitude,
                last_location_update: new Date().toISOString()
              })
              .eq('id', driver.id);
          }
        } catch (err) {
          console.error('Erreur update location:', err);
        }
      },
      (error) => {
              console.error('Erreur GPS:', error);
              setLocationError(`Impossible d'obtenir votre position (code ${error.code}: ${error.message})`);
        setIsTrackingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    // Stocker le watchId pour pouvoir l'arrêter plus tard
    localStorage.setItem('gps_watch_id', String(watchId));
  };

  // Arrêter le suivi GPS
  const stopLocationTracking = () => {
    const watchId = localStorage.getItem('gps_watch_id');
    if (watchId) {
      navigator.geolocation.clearWatch(Number(watchId));
      localStorage.removeItem('gps_watch_id');
    }
    setIsTrackingLocation(false);
  };

  // Terminer une livraison - Marquer comme "Arrivé" (en attente de confirmation client)
  const markAsArrived = async (order: Order) => {
    try {
      // Générer un code de confirmation à 4 chiffres
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      await supabase
        .from('orders')
        .update({ 
          status: 'En attente de confirmation',
          delivery_code: code,
          delivered_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      setActiveOrder({ ...order, status: 'En attente de confirmation', delivery_code: code });
      setShowConfirmationInput(false);
      setConfirmationCode('');
      fetchOrders();
    } catch (err) {
      console.error('Erreur mark as arrived:', err);
    }
  };

  // Confirmer la livraison avec le code client
  const confirmDeliveryWithCode = async (order: Order) => {
    if (confirmationCode !== order.delivery_code) {
      setConfirmationError('Code incorrect. Demandez le code au client.');
      return;
    }
    
    await completeDelivery(order, 'client');
  };

  // Forcer la confirmation (livreur confirme sans code client)
  const forceConfirmDelivery = async (order: Order) => {
    await completeDelivery(order, 'driver');
  };

  // Terminer une livraison
  const completeDelivery = async (order: Order, confirmedBy: 'client' | 'driver' = 'driver') => {
    try {
      // Arrêter le suivi GPS
      stopLocationTracking();
      
      await supabase
        .from('orders')
        .update({ 
          status: 'Livré',
          driver_latitude: null,
          driver_longitude: null,
          confirmed_at: new Date().toISOString(),
          confirmed_by: confirmedBy
        })
        .eq('id', order.id);
      
      // Réduire le stock et ajouter les logs pour chaque article
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          // Récupérer le stock actuel du produit
          const { data: productData } = await supabase
            .from('products')
            .select('stock_quantity, name')
            .eq('id', item.id)
            .single();
          
          if (productData) {
            const previousStock = productData.stock_quantity ?? 0;
            const newStock = Math.max(0, previousStock - item.quantity);
            
            // Mettre à jour le stock
            await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', item.id);
            
            // Ajouter une entrée dans stock_logs
            await supabase.from('stock_logs').insert({
              product_id: item.id,
              product_name: productData.name,
              type: 'out',
              quantity_change: -item.quantity,
              previous_quantity: previousStock,
              new_quantity: newStock,
              reason: `Vente - Commande #${order.id.slice(0, 8).toUpperCase()} - ${order.full_name}`,
              order_id: order.id,
              created_by: driver?.id || null
            });
          }
        }
      }
      
      // Vérifier s'il reste des commandes
      const remaining = orders.filter(o => o.id !== order.id && o.status !== 'Livré');
      if (remaining.length === 0) {
        await updateDriverStatus('Disponible');
      }
      
      setActiveOrder(null);
      setShowConfirmationInput(false);
      setConfirmationCode('');
      setConfirmationError('');
      fetchOrders();
    } catch (err) {
      console.error('Erreur complete delivery:', err);
    }
  };

  // Ouvrir dans Google Maps
  const openInMaps = (address: string, neighborhood: string) => {
    const query = encodeURIComponent(`${address}, ${neighborhood}, Lomé, Togo`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Appeler le client
  const callClient = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // WhatsApp client
  const whatsappClient = (phone: string, order: Order) => {
    const message = encodeURIComponent(
      `Bonjour ${order.full_name}! 🧊\n\n` +
      `Je suis votre livreur PRO-GLAÇONS.\n` +
      `Je suis en route avec votre commande!\n\n` +
      `📍 Adresse: ${order.address}\n` +
      `💰 Total: ${order.total?.toLocaleString()} FCFA\n\n` +
      `À très vite! 🚚`
    );
    window.open(`https://wa.me/${phone.replace(/\s/g, '')}?text=${message}`, '_blank');
  };

  // Écran de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // Écran de connexion
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-cyan-500/30">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">PRO-GLAÇONS</h1>
            <p className="text-slate-400 text-sm font-medium">Espace Livreur</p>
          </div>

          <form onSubmit={handleLogin} className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700">
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Votre numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  placeholder="Ex: 90 12 34 56"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
              Se connecter
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            Accès réservé aux livreurs enregistrés
          </p>
        </div>
      </div>
    );
  }

  // Dashboard livreur
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Snowflake className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg leading-tight text-white">{driver?.name}</h1>
              <p className="text-xs text-slate-300 font-medium">{driver?.phone}</p>
            </div>
          </div>
          <button
            onClick={() => fetchOrders()}
            disabled={isRefreshing}
            className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Status Toggle */}
      <div className="px-4 py-4">
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mon statut</p>
          <div className="grid grid-cols-3 gap-2">
            {(['Disponible', 'En livraison', 'Hors service'] as DriverStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => updateDriverStatus(status)}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all ${
                  driver?.status === status
                    ? status === 'Disponible' 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : status === 'En livraison'
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-slate-600 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="px-4 space-y-4">
          {/* Message de feedback */}
          {profileMessage && (
            <div className={`p-4 rounded-2xl font-bold ${
              profileMessage.type === 'success' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {profileMessage.text}
            </div>
          )}

          {/* Informations du profil */}
          <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-6 space-y-5">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-2xl font-black">
                {driver?.name?.charAt(0)?.toUpperCase() || 'L'}
              </div>
              <h2 className="text-xl font-black text-white">{driver?.name}</h2>
              <p className="text-sm text-white">Livreur</p>
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <User size={14} /> Nom
              </label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Votre nom"
                />
              ) : (
                <div className="bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white font-medium">
                  {driver?.name || 'Non défini'}
                </div>
              )}
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Phone size={14} /> Téléphone
              </label>
              {isEditingProfile ? (
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Ex: 90 12 34 56"
                />
              ) : (
                <div className="bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white font-medium">
                  {driver?.phone || 'Non défini'}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              {isEditingProfile ? (
                <>
                  <button
                    onClick={() => { 
                      setIsEditingProfile(false); 
                      setProfileMessage(null);
                      setProfileForm({ name: driver?.name || '', phone: driver?.phone || '' });
                    }}
                    className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Annuler
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Enregistrer
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit3 size={18} /> Modifier mes informations
                </button>
              )}
            </div>
          </div>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors border border-red-500/30"
          >
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      )}

      {/* DELIVERIES TAB */}
      {activeTab === 'deliveries' && (
        <>
          {/* Active Order Card */}
          {activeOrder && (
        <div className="px-4 mb-4">
          <div className={`rounded-3xl p-5 relative overflow-hidden border-2 ${
            activeOrder.status === 'En attente de confirmation'
              ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/50'
              : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/50'
          }`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${
              activeOrder.status === 'En attente de confirmation' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
            }`}></div>
            
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                activeOrder.status === 'En attente de confirmation' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></div>
              <span className={`text-xs font-black uppercase tracking-wider ${
                activeOrder.status === 'En attente de confirmation' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {activeOrder.status === 'En attente de confirmation' ? 'En attente de confirmation client' : 'Livraison en cours'}
              </span>
            </div>

            <h3 className="text-xl font-black mb-2">{activeOrder.full_name}</h3>
            
           <div className="space-y-3 mb-5">
  <div className="flex items-start gap-3">
    <MapPin className={`w-5 h-5 mt-0.5 ${activeOrder.status === 'En attente de confirmation' ? 'text-emerald-400' : 'text-amber-400'}`} />
    <div className="flex-1">
      <p className="font-bold text-white">{activeOrder.address}</p>
      <p className="text-sm text-slate-100">{activeOrder.neighborhood}</p>
    </div>
    <button
      onClick={() => {
        navigator.clipboard.writeText(`${activeOrder.address}, ${activeOrder.neighborhood}`);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      }}
      className="p-2 bg-slate-700/50 rounded-lg"
    >
      {copiedAddress ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-100" />}
    </button>
  </div>
  <div className="flex items-center gap-3">
    <Phone className={`w-5 h-5 ${activeOrder.status === 'En attente de confirmation' ? 'text-emerald-400' : 'text-amber-400'}`} />
    <span className="font-bold text-white">{activeOrder.phone}</span>
  </div>
  <div className="flex items-center gap-3">
    <Package className={`w-5 h-5 ${activeOrder.status === 'En attente de confirmation' ? 'text-emerald-400' : 'text-amber-400'}`} />
    <span className="font-bold text-white">{activeOrder.items?.length || 0} article(s) • {activeOrder.total?.toLocaleString()} F</span>
  </div>
</div>

           {/* Diagnostic GPS tracking */}
{activeOrder.status === 'Livraison en cours' && (
  <>
    {isTrackingLocation ? (
      <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3">
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-bold text-emerald-400">GPS actif - Le client suit votre position</span>
      </div>
    ) : (
      <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-4 h-4 text-yellow-400" />
        <span className="text-sm text-yellow-600 font-bold">Le suivi GPS n'est pas actif. Autorisez la géolocalisation ou vérifiez votre navigateur.</span>
      </div>
    )}
    {locationError && (
      <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-sm text-red-400">{locationError}</span>
      </div>
    )}
  </>
)}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => openInMaps(activeOrder.address, activeOrder.neighborhood)}
                className="bg-blue-500 hover:bg-blue-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1"
              >
                <Navigation className="w-4 h-4" />
                GPS
              </button>
              <button
                onClick={() => callClient(activeOrder.phone)}
                className="bg-emerald-500 hover:bg-emerald-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1"
              >
                <Phone className="w-4 h-4" />
                Appeler
              </button>
              <button
                onClick={() => whatsappClient(activeOrder.phone, activeOrder)}
                className="bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>

            {/* Workflow de confirmation */}
            {activeOrder.status === 'Livraison en cours' ? (
              // Étape 1: Le livreur est en route
              <button
                onClick={() => markAsArrived(activeOrder)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
              >
                <MapPin className="w-6 h-6" />
                Je suis arrivé
              </button>
            ) : activeOrder.status === 'En attente de confirmation' ? (
              // Étape 2: Le livreur est arrivé, attend confirmation
              <div className="space-y-4">
                {/* Code de confirmation pour le client */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Code de confirmation client
                  </p>
                  <p className="text-4xl font-black tracking-[0.3em] text-emerald-400">
                    {activeOrder.delivery_code}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Demandez ce code au client pour confirmer
                  </p>
                </div>

                {/* Input pour le code */}
                {showConfirmationInput ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Entrez le code client"
                        value={confirmationCode}
                        onChange={(e) => {
                          setConfirmationCode(e.target.value);
                          setConfirmationError('');
                        }}
                        maxLength={4}
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl py-4 px-4 text-center text-2xl font-black tracking-[0.3em] text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    
                    {confirmationError && (
                      <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {confirmationError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setShowConfirmationInput(false);
                          setConfirmationCode('');
                          setConfirmationError('');
                        }}
                        className="bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => confirmDeliveryWithCode(activeOrder)}
                        disabled={confirmationCode.length !== 4}
                        className="bg-emerald-500 hover:bg-emerald-600 py-3 rounded-xl font-bold disabled:opacity-50"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowConfirmationInput(true)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                      Entrer le code client
                    </button>
                    
                    <button
                      onClick={() => forceConfirmDelivery(activeOrder)}
                      className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Confirmer sans code (problème client)
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Pending Orders */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">Mes Commandes</h2>
          <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold">
            {orders.filter(o => o.status === 'En attente').length} en attente
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-slate-800/50 rounded-3xl p-12 text-center border border-slate-700">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Aucune commande assignée</p>
            <p className="text-slate-500 text-sm mt-1">Les nouvelles commandes apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders
              .filter(o => o.status === 'En attente')
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{order.full_name}</h3>
                      <p className="text-slate-400 text-sm">{order.neighborhood}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-cyan-400">{order.total?.toLocaleString()} F</p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{order.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{order.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Package className="w-4 h-4 text-slate-500" />
                      <span>{order.items?.length || 0} article(s)</span>
                    </div>
                  </div>

                  {!activeOrder && (
                    <button
                      onClick={() => startDelivery(order)}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Démarrer la livraison
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
        </>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-6 py-4">
        <div className="flex items-center justify-around">
          <button 
            onClick={() => setActiveTab('deliveries')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'deliveries' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Truck className="w-6 h-6" />
            <span className="text-[10px] font-bold">Livraisons</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold">Mon Profil</span>
          </button>
          <button 
            onClick={() => router.push('/')}
            className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold">Accueil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
