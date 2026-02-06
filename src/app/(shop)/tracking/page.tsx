
"use client";
import dynamicImport from 'next/dynamic';
const DeliveryMap = dynamicImport(() => import('@/components/DeliveryMap'), { ssr: false });
import ProtectedRoute from '@/components/ProtectedRoute';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useApp } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import { Package, CheckCircle2, Truck, MapPin, Calendar, Clock, ShoppingBag, ChevronDown, ChevronUp, Phone, DollarSign, History, Filter, Navigation, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';


const statusSteps = [
  { key: 'En attente', label: 'Validée', icon: CheckCircle2 },
  { key: 'Préparation', label: 'Préparation', icon: Package },
  { key: 'Livraison en cours', label: 'En Route', icon: Truck },
  { key: 'En attente de confirmation', label: 'Arrivé', icon: MapPin },
  { key: 'Livré', label: 'Livré', icon: CheckCircle2 },
];

const getStatusIndex = (status: string) => {
  if (status === 'En attente') return 0;
  if (status === 'Préparation') return 1;
  if (status === 'Livraison en cours') return 2;
  if (status === 'En attente de confirmation') return 3;
  if (status === 'Livré') return 4;
  return 0;
};

export default function TrackingPage() {
  const { session, orders, user, userProfile } = useApp();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState<typeof orders>([]);


  
  // Synchroniser les commandes locales avec le contexte
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // Souscription realtime pour les changements de statut des commandes
  useEffect(() => {
    const userId = session?.user?.id || user?.id || userProfile?.id;
    if (!userId) return;

    const channel = supabase
      .channel('user-orders-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Mettre à jour la commande locale immédiatement
        const updatedOrder = payload.new as Order;
        setLocalOrders(prev => prev.map(o => 
          o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, user?.id, userProfile?.id]);
  
  const userOrders = session || user ? localOrders.filter(o => 
    o.user_id === session?.user?.id || o.user_id === user?.id || o.user_id === userProfile?.id
  ) : [];

  // Séparer les commandes actives et l'historique
  const activeOrders = userOrders.filter(o => o.status !== 'Livré' && o.status !== 'Annulé');
  const historyOrders = userOrders.filter(o => o.status === 'Livré' || o.status === 'Annulé');

  // Préparer les données pour la carte interactive (après activeOrders)
  const driverMarkers = driverLocation
    ? [{ id: 'driver', name: 'Livreur', phone: '', lat: driverLocation.lat, lng: driverLocation.lng, status: 'delivering' as 'delivering' }]
    : [];
  const orderMarkers = activeOrders
    .filter(o => typeof o.driver_latitude === 'number' && typeof o.driver_longitude === 'number')
    .map(o => ({
      id: o.id,
      customerName: user?.full_name || userProfile?.full_name || '',
      address: o.address,
      lat: o.driver_latitude as number,
      lng: o.driver_longitude as number,
      status: o.status
    }));
  const zones: any[] = [];

  // Trouver la commande en attente de confirmation
  const orderAwaitingConfirmation = activeOrders.find(o => o.status === 'En attente de confirmation');

  // Trouver la commande en livraison pour le suivi GPS
  const orderInDelivery = activeOrders.find(o => o.status === 'Livraison en cours');
  
  // Confirmer la réception de la commande
  const confirmDelivery = async (orderId: string, deliveryCode: string) => {
    setIsConfirming(true);
    try {
      // Trouver la commande pour récupérer les items
      const orderToConfirm = userOrders.find(o => o.id === orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'Livré',
          confirmed_at: new Date().toISOString(),
          confirmed_by: 'client'
        })
        .eq('id', orderId)
        .eq('delivery_code', deliveryCode);
      
      if (error) {
        console.error('Erreur confirmation:', error);
        setIsConfirming(false);
        return;
      }
      
      // Réduire le stock et ajouter les logs pour chaque article
      if (orderToConfirm?.items && orderToConfirm.items.length > 0) {
        for (const item of orderToConfirm.items) {
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
              reason: `Vente - Commande #${orderId.slice(0, 8).toUpperCase()} - ${orderToConfirm.full_name}`,
              order_id: orderId,
              created_by: null
            });
          }
        }
      }
      
      setConfirmSuccess(orderId);
      setTimeout(() => setConfirmSuccess(null), 5000);
      
      // Rafraîchir les commandes côté client
      if (typeof window !== 'undefined') {
        setTimeout(() => window.location.reload(), 100);
      }
    } catch (err) {
      console.error('Erreur confirmation:', err);
    }
    setIsConfirming(false);
  };
  
  // Suivi GPS en temps réel
  const fetchDriverLocation = useCallback(async () => {
    if (!orderInDelivery) return;
    
    setIsLoadingLocation(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('driver_latitude, driver_longitude')
        .eq('id', orderInDelivery.id)
        .single();
      
      if (!error && data && data.driver_latitude && data.driver_longitude) {
        setDriverLocation({
          lat: data.driver_latitude,
          lng: data.driver_longitude
        });
      }
    } catch (err) {
      console.error('Erreur fetch driver location:', err);
    }
    setIsLoadingLocation(false);
  }, [orderInDelivery]);

  // Polling pour la position du livreur
  useEffect(() => {
    if (orderInDelivery) {
      fetchDriverLocation();
      const interval = setInterval(fetchDriverLocation, 10000); // Toutes les 10 secondes
      
      // Realtime subscription
      const channel = supabase
        .channel('driver-location')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderInDelivery.id}`
        }, (payload) => {
          const data = payload.new as { driver_latitude?: number, driver_longitude?: number };
          if (data.driver_latitude && data.driver_longitude) {
            setDriverLocation({
              lat: data.driver_latitude,
              lng: data.driver_longitude
            });
          }
        })
        .subscribe();
      
      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [orderInDelivery, fetchDriverLocation]);
  
  // Filtrer par statut
  const displayOrders = viewMode === 'active' ? activeOrders : historyOrders;
  const filteredOrders = filterStatus === 'all' 
    ? displayOrders 
    : displayOrders.filter(o => o.status === filterStatus);

  // Stats
  const totalSpent = userOrders.filter(o => o.status === 'Livré').reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = userOrders.length;
  const deliveredOrders = userOrders.filter(o => o.status === 'Livré').length;

  // Ouvrir la carte avec la position du livreur
  const openDriverLocationMap = useCallback(() => {
    if (driverLocation) {
      // window.open est appelé uniquement lors d’un clic utilisateur
      window.open(`https://www.google.com/maps?q=${driverLocation.lat},${driverLocation.lng}`, '_blank');
    }
  }, [driverLocation]);

  // Préparer les données pour la carte


  return (
    <ProtectedRoute>
      <div className="pt-32 pb-24 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: 'Suivi de Commande' }]} />
          

          <div className="mb-12">
            <h1 className="text-4xl font-black text-[#1E3A8A] mb-2">
              Suivi <span className="text-[#00ADEF]">Temps Réel</span>
            </h1>
            <p className="text-slate-500 italic">Gardez un œil sur la fraîcheur de vos commandes.</p>
          </div>

          {/* Carte interactive temps réel */}
          <div className="mb-8">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg" style={{ height: 320, minHeight: 240 }}>
              <DeliveryMap
                drivers={driverMarkers}
                orders={orderMarkers}
                zones={zones}
                mapView={driverMarkers.length > 0 ? 'drivers' : 'orders'}
              />
            </div>
          </div>

          {!session && !user ? (
            <div className="bg-white rounded-[2rem] p-12 text-center shadow-lg border border-slate-100">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-[#00ADEF]" />
              </div>
              <h2 className="text-2xl font-black text-[#1E3A8A] mb-4">Connectez-vous</h2>
              <p className="text-slate-500 mb-6">
                Connectez-vous pour suivre vos commandes en temps réel.
              </p>
              <Link 
                href="/auth?redirect=/tracking"
                className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white px-8 py-4 rounded-full font-bold hover:bg-[#00ADEF] transition-colors"
              >
                Se connecter
              </Link>
            </div>
          ) : userOrders.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center shadow-lg border border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-[#1E3A8A] mb-4">Aucune commande</h2>
              <p className="text-slate-500 mb-6">
                Vous n&apos;avez pas encore passé de commande.
              </p>
              <Link 
                href="/catalog"
                className="inline-flex items-center gap-2 bg-[#00ADEF] text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all"
              >
                Découvrir le catalogue
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Confirmation Card - Affiché quand le livreur est arrivé */}
              {orderAwaitingConfirmation && (
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-[2rem] p-6 text-white shadow-2xl shadow-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs font-black uppercase tracking-wider">Livreur arrivé!</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-black mb-1">Confirmez la réception</h3>
                      <p className="text-white/80 text-sm">Commande #{orderAwaitingConfirmation.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <CheckCircle2 className="w-12 h-12 text-white/80" />
                  </div>
                  
                  {/* Code de confirmation */}
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center mb-4">
                    <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                      Votre code de confirmation
                    </p>
                    <p className="text-5xl font-black tracking-[0.3em]">
                      {orderAwaitingConfirmation.delivery_code}
                    </p>
                    <p className="text-xs text-white/70 mt-3">
                      Communiquez ce code au livreur pour confirmer la réception
                    </p>
                  </div>
                  
                  {confirmSuccess === orderAwaitingConfirmation.id ? (
                    <div className="bg-white text-emerald-600 py-4 rounded-xl font-black flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Livraison confirmée!
                    </div>
                  ) : (
                    <button
                      onClick={() => confirmDelivery(orderAwaitingConfirmation.id, orderAwaitingConfirmation.delivery_code || '')}
                      disabled={isConfirming}
                      className="w-full bg-white text-emerald-600 py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                    >
                      {isConfirming ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      J&apos;ai bien reçu ma commande
                    </button>
                  )}
                </div>
              )}

              {/* GPS Tracking Card - Affiché uniquement si livraison en cours */}
              {orderInDelivery && (
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] p-6 text-white shadow-2xl shadow-orange-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs font-black uppercase tracking-wider">Livreur en route</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-black mb-1">Votre commande arrive!</h3>
                      <p className="text-white/80 text-sm">Commande #{orderInDelivery.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <Truck className="w-12 h-12 text-white/80" />
                  </div>
                  
                  {driverLocation ? (
                    <div className="space-y-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Navigation className="w-5 h-5" />
                          <span className="font-bold">Position GPS active</span>
                        </div>
                        <div className="text-xs text-white/70">
                          Mise à jour en temps réel
                        </div>
                      </div>
                      
                      <button
                        onClick={openDriverLocationMap}
                        className="w-full bg-white text-orange-600 py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
                      >
                        <MapPin className="w-5 h-5" />
                        Voir sur la carte
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-center gap-3">
                      {isLoadingLocation ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="font-medium">Localisation du livreur...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-5 h-5" />
                          <span className="font-medium">En attente de la position GPS...</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center">
                  <ShoppingBag className="w-8 h-8 text-[#00ADEF] mx-auto mb-2" />
                  <p className="text-2xl font-black text-[#1E3A8A]">{totalOrders}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Commandes</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-[#1E3A8A]">{deliveredOrders}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Livrées</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center">
                  <DollarSign className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-[#1E3A8A]">{totalSpent.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">F Dépensés</p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('active')}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                      viewMode === 'active' 
                        ? 'bg-[#00ADEF] text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Truck size={16} className="inline mr-2" />
                    En cours ({activeOrders.length})
                  </button>
                  <button
                    onClick={() => setViewMode('history')}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                      viewMode === 'history' 
                        ? 'bg-[#00ADEF] text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <History size={16} className="inline mr-2" />
                    Historique ({historyOrders.length})
                  </button>
                </div>
                
                {/* Filter */}
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-100 border-none rounded-lg px-4 py-2 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-[#00ADEF]"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="En attente">En attente</option>
                    <option value="Livraison en cours">En livraison</option>
                    <option value="Livré">Livré</option>
                  </select>
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center shadow-lg border border-slate-100">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">Aucune commande {viewMode === 'active' ? 'en cours' : 'dans l\'historique'}</p>
                </div>
              ) : filteredOrders.map(order => {
                const currentStatusIndex = getStatusIndex(order.status);
                const isDelivered = order.status === 'Livré';
                const isExpanded = expandedOrder === order.id;
                
                return (
                  <div key={order.id} className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
                    <div 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 cursor-pointer"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDelivered ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-[#00ADEF]'}`}>
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-[#1E3A8A]">
                            Commande #{order.id.slice(0, 8).toUpperCase()}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {order.neighborhood}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                          isDelivered ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-[#00ADEF]'
                        }`}>
                          {order.status}
                        </span>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Total</p>
                          <p className="text-xl font-black text-[#1E3A8A]">{order.total?.toLocaleString()} <span className="text-xs">F</span></p>
                        </div>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    {/* Timeline - Compact */}
                    <div className="relative mb-6">
                      <div className="flex justify-between items-center">
                        {statusSteps.map((step, index) => {
                          const isCompleted = index <= currentStatusIndex;
                          const isCurrent = index === currentStatusIndex;
                          const IconComponent = step.icon;
                          
                          return (
                            <div key={step.key} className="flex flex-col items-center relative z-10">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                isCompleted 
                                  ? 'bg-[#00ADEF] border-[#00ADEF] text-white' 
                                  : 'bg-white border-slate-200 text-slate-300'
                              } ${isCurrent ? 'ring-4 ring-[#00ADEF]/20' : ''}`}>
                                <IconComponent size={16} />
                              </div>
                              <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${isCompleted ? 'text-[#1E3A8A]' : 'text-slate-300'}`}>
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Progress bar */}
                      <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200 -z-0">
                        <div 
                          className="h-full bg-[#00ADEF] transition-all duration-500"
                          style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Order Details - Expandable */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 pt-6 space-y-4 animate-in slide-in-from-top-2">
                        {/* Contact Info */}
                        <div className="grid sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={16} className="text-slate-400" />
                            <span>{order.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin size={16} className="text-slate-400" />
                            <span>{order.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock size={16} className="text-slate-400" />
                            <span>{new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-[#1E3A8A] text-sm uppercase tracking-wider">Articles commandés</h4>
                          {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                              <div className="flex items-center gap-3">
                                {item.imageUrl && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                )}
                                <div>
                                  <p className="font-bold text-[#1E3A8A]">{item.name}</p>
                                  <p className="text-xs text-slate-400">{item.unit} × {item.quantity}</p>
                                </div>
                              </div>
                              <p className="font-black text-[#00ADEF]">{(item.price * item.quantity).toLocaleString()} F</p>
                            </div>
                          )) : (
                            <p className="text-slate-400 text-sm">Détails non disponibles</p>
                          )}
                        </div>

                        {/* Summary */}
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#00ADEF]/10 to-[#1E3A8A]/10 rounded-xl">
                          <div>
                            <p className="text-xs text-slate-500">Frais de livraison</p>
                            <p className="font-bold text-[#1E3A8A]">{order.delivery_fee?.toLocaleString() || 0} F</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Total payé</p>
                            <p className="text-2xl font-black text-[#00ADEF]">{order.total?.toLocaleString()} F</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
