'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Minus, Plus, ShoppingBag, Trash2, CheckCircle2, CreditCard, MapPin, User, Phone, Loader2, ChevronRight, ArrowLeft, Banknote, Smartphone, MessageCircle, Copy, Check, Tag, Clock, Sparkles, Heart } from 'lucide-react';
import { useApp } from '@/lib/context';
import { NEIGHBORHOODS, PROMO_CODES } from '@/constants';
import { useHaptics } from '@/hooks/useHaptics';
import SwipeableCartItem from './SwipeableCartItem';
import EmptyState from './EmptyState';

const STORAGE_KEY = 'proglacons_user_info';

type CartStep = 'cart' | 'info' | 'review';

// Composant Confetti
const Confetti = () => {
  const colors = ['#00ADEF', '#1E3A8A', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
  const confettis = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {confettis.map(c => (
        <div
          key={c.id}
          className="absolute animate-confetti"
          style={{
            left: `${c.left}%`,
            top: '-20px',
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
          }}
        >
          <div
            style={{
              width: c.size,
              height: c.size * 0.6,
              backgroundColor: c.color,
              transform: `rotate(${c.rotation}deg)`,
              borderRadius: '2px',
            }}
          />
        </div>
      ))}
    </div>
  );
};

const Cart = () => {
  const router = useRouter();
  const { cartItems, isCartOpen, setIsCartOpen, updateCartQuantity, removeFromCart, createOrder, favorites, toggleFavorite, products } = useApp();
  const { haptics } = useHaptics();
  
  const [step, setStep] = useState<CartStep>('cart');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', paymentMethod: 'cash' as 'cash' | 'mobile_money' });
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [savedOrderData, setSavedOrderData] = useState<{ total: number; items: typeof cartItems } | null>(null);

  const MOBILE_MONEY_NUMBER = '79 74 75 75';
  const WHATSAPP_NUMBER = '+22879747575';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isCartOpen) {
      setStep('cart');
      setOrderSuccess(false);
      setShowConfetti(false);
    }
  }, [isCartOpen]);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const quantityDiscount = cartItems.reduce((sum, item) => sum + item.quantity, 0) >= 10 ? total * 0.1 : 0;
  const deliveryFee = selectedNeighborhood.fee;

  // Calcul du code promo
  const promoDiscount = useCallback(() => {
    if (!appliedPromo || !PROMO_CODES[appliedPromo]) return 0;
    const promo = PROMO_CODES[appliedPromo];
    if (promo.minOrder && total < promo.minOrder) return 0;
    if (promo.type === 'percent') return Math.floor((total - quantityDiscount) * promo.discount / 100);
    return promo.discount;
  }, [appliedPromo, total, quantityDiscount])();

  const finalTotal = total - quantityDiscount - promoDiscount + deliveryFee;

  const applyPromoCode = () => {
    const code = promoInput.toUpperCase().trim();
    if (!code) return;
    
    if (PROMO_CODES[code]) {
      const promo = PROMO_CODES[code];
      if (promo.minOrder && total < promo.minOrder) {
        setPromoError(`Commande minimum: ${promo.minOrder.toLocaleString()} FCFA`);
        return;
      }
      setAppliedPromo(code);
      setPromoError('');
      setPromoInput('');
    } else {
      setPromoError('Code promo invalide');
    }
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    
    // Sauvegarder les données avant de vider le panier
    setSavedOrderData({ total: finalTotal, items: [...cartItems] });
    
    try {
      await createOrder({
        ...formData,
        neighborhood: selectedNeighborhood.name,
        deliveryFee: deliveryFee,
        total: finalTotal,
        promoCode: appliedPromo,
        promoDiscount: promoDiscount
      });
      setOrderSuccess(true);
      setShowConfetti(true);
      setIsSubmitting(false);
      // Arrêter les confettis après 4 secondes
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (err) {
      console.error('Erreur création commande:', err);
      setIsSubmitting(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {showConfetti && <Confetti />}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSubmitting && setIsCartOpen(false)}></div>
      
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-left">
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#00ADEF]">
              {step === 'cart' ? <ShoppingBag size={20} /> : step === 'info' ? <User size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1E3A8A] leading-tight">
                {step === 'cart' ? 'Votre Panier' : step === 'info' ? 'Livraison' : 'Confirmation'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Étape {step === 'cart' ? '1' : step === 'info' ? '2' : '3'} sur 3
              </p>
            </div>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {orderSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8 px-4">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-[1.5rem] flex items-center justify-center mb-5 shadow-xl shadow-green-100 animate-bounce">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-[#1E3A8A] mb-2">Commande Reçue !</h3>
              <p className="text-slate-500 font-medium leading-relaxed text-sm mb-6">Merci pour votre confiance.</p>
              
              {formData.paymentMethod === 'mobile_money' && savedOrderData && (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">💰 Paiement Mobile Money</p>
                  <p className="text-sm text-slate-600 mb-3">Envoyez <span className="font-black text-[#1E3A8A]">{savedOrderData.total.toLocaleString()} FCFA</span> au :</p>
                  <div className="bg-white rounded-xl p-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-[#1E3A8A]">{MOBILE_MONEY_NUMBER}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('79747575');
                        setCopiedNumber(true);
                        setTimeout(() => setCopiedNumber(false), 2000);
                      }}
                      className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      {copiedNumber ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-slate-500" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3">Nom: <strong>PRO-GLAÇONS</strong></p>
                </div>
              )}

              {formData.paymentMethod === 'cash' && savedOrderData && (
                <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-5 mb-4">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">💵 Paiement en espèces</p>
                  <p className="text-sm text-slate-600">Préparez <span className="font-black text-[#1E3A8A]">{savedOrderData.total.toLocaleString()} FCFA</span></p>
                  <p className="text-xs text-slate-400 mt-1">Le livreur accepte uniquement le montant exact</p>
                </div>
              )}

              {savedOrderData && <a
                href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(
                  `🧊 *Nouvelle Commande PRO-GLAÇONS*\n\n` +
                  `👤 Nom: ${formData.name}\n` +
                  `📞 Tél: ${formData.phone}\n` +
                  `📍 Adresse: ${formData.address} (${selectedNeighborhood.name})\n\n` +
                  `🛒 Articles:\n${savedOrderData.items.map(i => `  • ${i.name} x${i.quantity} = ${(i.price * i.quantity).toLocaleString()} F`).join('\n')}\n\n` +
                  `💰 Total: ${savedOrderData.total.toLocaleString()} FCFA\n` +
                  `💳 Paiement: ${formData.paymentMethod === 'cash' ? 'Cash à la livraison' : 'Mobile Money'}\n\n` +
                  `Merci de confirmer ma commande! 🙏`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-green-200"
              >
                <MessageCircle className="w-5 h-5" />
                Confirmer via WhatsApp
              </a>}
              <p className="text-[10px] text-slate-400 mt-3">Notre équipe vous contactera sous 5 minutes</p>
            </div>
          ) : step === 'cart' ? (
            cartItems.length === 0 ? (
              <EmptyState
                type="cart"
                action={{
                  label: 'Voir le catalogue',
                  onClick: () => {
                    setIsCartOpen(false);
                    router.push('/catalog');
                  },
                }}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 text-center mb-2">← Swipez pour supprimer | Swipez pour ajouter aux favoris →</p>
                {cartItems.map((item) => {
                  const isFavorite = favorites.includes(item.id);
                  const product = products.find(p => p.id === item.id);
                  return (
                    <SwipeableCartItem
                      key={item.id}
                      onDelete={() => {
                        removeFromCart(item.id);
                        haptics.removeFromCart();
                      }}
                      onFavorite={product ? () => {
                        toggleFavorite(product);
                        haptics.toggleFavorite();
                      } : undefined}
                      isFavorite={isFavorite}
                    >
                      <div className="flex gap-4 p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white shadow-sm">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-black text-[#1E3A8A] text-sm">{item.name}</h4>
                            <div className="flex items-center gap-2">
                              {isFavorite && <Heart size={12} className="text-red-500 fill-current" />}
                              <button onClick={() => { removeFromCart(item.id); haptics.removeFromCart(); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </div>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">{item.unit}</p>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                              <button onClick={() => { updateCartQuantity(item.id, -1); haptics.buttonPress(); }} className="p-1.5 hover:text-[#00ADEF] transition-colors"><Minus size={12} /></button>
                              <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                              <button onClick={() => { updateCartQuantity(item.id, 1); haptics.buttonPress(); }} className="p-1.5 hover:text-[#00ADEF] transition-colors"><Plus size={12} /></button>
                            </div>
                            <span className="font-black text-[#1E3A8A] text-sm">{(item.price * item.quantity).toLocaleString()} F</span>
                          </div>
                        </div>
                      </div>
                    </SwipeableCartItem>
                  );
                })}
              </div>
            )
          ) : step === 'info' ? (
            <div className="space-y-8">
              <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                <h4 className="font-black text-[#1E3A8A] text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#00ADEF]" /> Zone de livraison
                </h4>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-[#00ADEF] appearance-none"
                  value={selectedNeighborhood.name}
                  onChange={(e) => {
                    const n = NEIGHBORHOODS.find(nh => nh.name === e.target.value);
                    if (n) setSelectedNeighborhood(n);
                  }}
                >
                  {NEIGHBORHOODS.map(n => <option key={n.name} value={n.name}>{n.name} (+{n.fee} F)</option>)}
                </select>
                
                {/* Temps de livraison estimé */}
                <div className="mt-4 flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Livraison estimée</p>
                    <p className="text-lg font-black text-emerald-600">{selectedNeighborhood.estimatedTime}</p>
                  </div>
                </div>
              </div>

              {/* Code Promo */}
              <div className="bg-purple-50/50 p-6 rounded-[2rem] border border-purple-100">
                <h4 className="font-black text-[#1E3A8A] text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-500" /> Code promo
                </h4>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-black text-green-700">{appliedPromo}</p>
                        <p className="text-xs text-green-600">{PROMO_CODES[appliedPromo]?.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      className="text-red-500 hover:text-red-700 text-sm font-bold"
                    >
                      Retirer
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Entrez votre code"
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-purple-400"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value); setPromoError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && applyPromoCode()}
                      />
                      <button
                        type="button"
                        onClick={applyPromoCode}
                        className="px-5 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors"
                      >
                        Appliquer
                      </button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs mt-2 font-medium">{promoError}</p>}
                    <p className="text-[10px] text-slate-400 mt-2">Codes disponibles: BIENVENUE10, ETE2026, FRAIS500</p>
                  </div>
                )}
              </div>

              {/* Mode de paiement */}
              <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100">
                <h4 className="font-black text-[#1E3A8A] text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500" /> Mode de paiement
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: 'cash'})}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.paymentMethod === 'cash'
                        ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 ring-2 ring-[#1E3A8A]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Banknote className={`w-6 h-6 ${formData.paymentMethod === 'cash' ? 'text-[#1E3A8A]' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${formData.paymentMethod === 'cash' ? 'text-[#1E3A8A]' : 'text-slate-500'}`}>Cash</span>
                    <span className="text-[10px] text-slate-400">À la livraison</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: 'mobile_money'})}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.paymentMethod === 'mobile_money'
                        ? 'border-[#00ADEF] bg-[#00ADEF]/5 ring-2 ring-[#00ADEF]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className={`w-6 h-6 ${formData.paymentMethod === 'mobile_money' ? 'text-[#00ADEF]' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${formData.paymentMethod === 'mobile_money' ? 'text-[#00ADEF]' : 'text-slate-500'}`}>Mobile Money</span>
                    <span className="text-[10px] text-slate-400">T-Money / Moov</span>
                  </button>
                </div>
                {formData.paymentMethod === 'mobile_money' && (
                  <div className="mt-4 p-4 bg-white rounded-xl border border-amber-200">
                    <p className="text-xs text-slate-500 mb-2">Envoyez le montant au numéro :</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-[#1E3A8A]">{MOBILE_MONEY_NUMBER}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('79747575');
                          setCopiedNumber(true);
                          setTimeout(() => setCopiedNumber(false), 2000);
                        }}
                        className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        {copiedNumber ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-600 mt-2 font-medium">⚠️ Envoyez APRÈS validation de votre commande</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-[#1E3A8A] text-xs uppercase tracking-widest ml-4">Vos coordonnées</h4>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input required type="text" placeholder="Nom complet" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 font-bold outline-none focus:ring-2 focus:ring-[#00ADEF] transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input required type="tel" placeholder="Téléphone (T-Money / Moov Money)" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 font-bold outline-none focus:ring-2 focus:ring-[#00ADEF] transition-all" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-5 top-5 w-5 h-5 text-slate-300" />
                  <textarea required placeholder="Indiquez votre adresse exacte ou des points de repère..." rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 font-bold outline-none focus:ring-2 focus:ring-[#00ADEF] transition-all resize-none" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}></textarea>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-blue-50 text-[#00ADEF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={32} />
                </div>
                <h3 className="text-xl font-black text-[#1E3A8A]">Vérification Finale</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Dernière étape avant expédition</p>
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ADEF]/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <h4 className="text-[10px] font-black text-[#00ADEF] uppercase tracking-[0.2em] mb-6">Récapitulatif Livraison</h4>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <User size={16} className="text-slate-500 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase">Destinataire</p>
                      <p className="font-bold">{formData.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone size={16} className="text-slate-500 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase">Contact</p>
                      <p className="font-bold">{formData.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin size={16} className="text-slate-500 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase">Adresse à {selectedNeighborhood.name}</p>
                      <p className="font-bold">{formData.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Panier ({cartItems.length} articles)</span>
                  <span className="font-bold">{total.toLocaleString()} F</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Frais de livraison</span>
                  <span className="font-bold">+{deliveryFee.toLocaleString()} F</span>
                </div>
                {quantityDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Remise Fidélité (10+ articles)</span>
                    <span className="font-bold">-{quantityDiscount.toLocaleString()} F</span>
                  </div>
                )}
                {appliedPromo && promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span className="flex items-center gap-1">
                      <Tag size={12} /> Code {appliedPromo}
                    </span>
                    <span className="font-bold">-{promoDiscount.toLocaleString()} F</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">Total Net</span>
                  <span className="text-3xl font-black text-[#00ADEF]">{finalTotal.toLocaleString()} <span className="text-sm">FCFA</span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {!orderSuccess && (
          <div className="p-6 border-t border-slate-100 space-y-4 bg-white">
            {step === 'cart' && cartItems.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-slate-500">Sous-total</span>
                <span className="text-xl font-black text-[#1E3A8A]">{total.toLocaleString()} F</span>
              </div>
            )}
            
            <div className="flex gap-3">
              {step !== 'cart' && (
                <button
                  onClick={() => setStep(step === 'review' ? 'info' : 'cart')}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft size={16} /> Retour
                </button>
              )}
              
              {step === 'cart' && cartItems.length > 0 && (
                <button
                  onClick={() => setStep('info')}
                  className="flex-1 bg-[#1E3A8A] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00ADEF] transition-colors"
                >
                  Continuer <ChevronRight size={16} />
                </button>
              )}
              
              {step === 'info' && (
                <button
                  onClick={() => setStep('review')}
                  disabled={!formData.name || !formData.phone || !formData.address}
                  className="flex-1 bg-[#1E3A8A] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00ADEF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer <ChevronRight size={16} />
                </button>
              )}
              
              {step === 'review' && (
                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  Valider la commande
                </button>
              )}
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-full text-center text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} /> Continuer mes achats
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
