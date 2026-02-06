'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCard from '@/components/ProductCard';
import LoyaltyCard from '@/components/LoyaltyCard';
import ReferralSystem from '@/components/ReferralSystem';
import PushNotifications from '@/components/PushNotifications';
import { useApp } from '@/lib/context';
import { useTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, ShoppingBag, Heart, Calendar, MapPin, Loader2, LogOut, Settings, Star, Users, Bell, Edit3, Save, X, Lock, Eye, EyeOff, Check } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, userProfile, orders, favoriteProducts, isLoading, logout, isAdmin } = useApp();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const userOrders = isAuthenticated ? orders.filter(o => o.user_id === user?.id || o.user_id === userProfile?.id) : [];

  // États pour l'édition du profil
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    neighborhood: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Initialiser le formulaire quand les données utilisateur changent
  useEffect(() => {
    if (user || userProfile) {
      setEditForm({
        full_name: user?.full_name || userProfile?.full_name || '',
        phone: user?.phone || userProfile?.phone || '',
        neighborhood: user?.neighborhood || userProfile?.neighborhood || ''
      });
    }
  }, [user, userProfile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Mettre à jour dans la table profiles
      const userId = user?.id || userProfile?.id;
      if (!userId) throw new Error('Utilisateur non trouvé');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          neighborhood: editForm.neighborhood
        })
        .eq('id', userId);

      if (error) throw error;

      setSaveMessage({ type: 'success', text: 'Profil mis à jour avec succès!' });
      setIsEditing(false);
      // Recharger la page pour mettre à jour les données
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      let message = 'Erreur lors de la mise à jour';
      if (err instanceof Error) message = err.message;
      setSaveMessage({ type: 'error', text: message });
      console.error('Erreur:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    // Validation
    if (passwordForm.newPassword.length < 6) {
      setSaveMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      setIsSaving(false);
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setSaveMessage({ type: 'success', text: 'Mot de passe modifié avec succès!' });
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      let message = 'Erreur lors du changement de mot de passe';
      if (err instanceof Error) message = err.message;
      setSaveMessage({ type: 'error', text: message });
      console.error('Erreur:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // On retire la redirection manuelle si !isAuthenticated (gérée par ProtectedRoute)

  const displayName = user?.full_name || userProfile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const displayEmail = user?.email || userProfile?.email || '';
  const displayPhone = user?.phone || userProfile?.phone || '';
  const displayNeighborhood = user?.neighborhood || userProfile?.neighborhood || '';

  return (
    <ProtectedRoute>
      {isLoading ? (
        <div className="pt-32 pb-24 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00ADEF] animate-spin" />
        </div>
      ) : (
        <div className={`pt-32 pb-24 min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}> 
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[{ label: 'Mon Profil' }]} />
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className={`rounded-[2rem] p-8 shadow-lg border sticky top-32 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-100'
                }`}>
                  {/* Message de feedback */}
                  {saveMessage && (
                    <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
                      saveMessage.type === 'success' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {saveMessage.type === 'success' ? <Check size={16} /> : <X size={16} />}
                      {saveMessage.text}
                    </div>
                  )}
                  {/* Infos utilisateur */}
                  <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-cyan-600" />
                    </div>
                    <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>{displayName}</h2>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-[#00ADEF]" />
                        <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{displayEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-[#00ADEF]" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className={`w-full text-sm font-medium rounded-lg px-2 py-1 border outline-none focus:ring-2 focus:ring-[#00ADEF] ${
                              isDark 
                                ? 'bg-slate-600 border-slate-500 text-white'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                            placeholder="Ex: 90 12 34 56"
                          />
                        ) : (
                          <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{displayPhone || '-'}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[#00ADEF]" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.neighborhood}
                            onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                            className={`w-full text-sm font-medium rounded-lg px-2 py-1 border outline-none focus:ring-2 focus:ring-[#00ADEF] ${
                              isDark 
                                ? 'bg-slate-600 border-slate-500 text-white'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                            placeholder="Votre quartier"
                          />
                        ) : (
                          <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{displayNeighborhood || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Boutons d'action */}
                  <div className="space-y-3">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setIsEditing(false); setSaveMessage(null); }}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-colors ${
                            isDark 
                              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <X size={16} /> Annuler
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#00ADEF] hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          Enregistrer
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-medium ${
                          isDark 
                            ? 'hover:bg-slate-700 text-slate-300'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Edit3 size={18} /> Modifier le profil
                      </button>
                    )}
                    <button
                      onClick={() => { setIsChangingPassword(!isChangingPassword); setSaveMessage(null); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-medium ${
                        isChangingPassword
                          ? 'bg-purple-100 text-purple-700'
                          : isDark 
                            ? 'hover:bg-slate-700 text-slate-300'
                            : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Lock size={18} /> Changer le mot de passe
                    </button>
                    {/* Formulaire changement mot de passe */}
                    {isChangingPassword && (
                      <div className={`p-4 rounded-xl space-y-3 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className={`w-full text-sm rounded-lg px-3 py-2 pr-10 border outline-none focus:ring-2 focus:ring-[#00ADEF] ${
                              isDark 
                                ? 'bg-slate-600 border-slate-500 text-white'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                            placeholder="Nouveau mot de passe"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                          >
                            {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className={`w-full text-sm rounded-lg px-3 py-2 pr-10 border outline-none focus:ring-2 focus:ring-[#00ADEF] ${
                              isDark 
                                ? 'bg-slate-600 border-slate-500 text-white'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                            placeholder="Confirmer le mot de passe"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                          >
                            {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <button
                          onClick={handleChangePassword}
                          disabled={isSaving || !passwordForm.newPassword || !passwordForm.confirmPassword}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                          Changer le mot de passe
                        </button>
                      </div>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors font-medium ${
                          isDark 
                            ? 'hover:bg-slate-700 text-slate-300'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Settings size={18} /> Espace Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-red-500 font-medium"
                    >
                      <LogOut size={18} /> Déconnexion
                    </button>
                  </div>
                </div>
              </div>
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Carte de Fidélité */}
                {user?.id && (
                  <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-lg">
                    <h3 className="text-xl font-black text-white flex items-center gap-3 mb-6">
                      <Star className="text-amber-400" fill="currentColor" /> Programme Fidélité
                    </h3>
                    <LoyaltyCard userId={user.id} />
                  </div>
                )}
                {/* Parrainage */}
                <div className={`rounded-[2rem] p-8 shadow-lg border ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-100'
                }`}>
                  <h3 className={`text-xl font-black flex items-center gap-3 mb-6 ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>
                    <Users className="text-purple-500" /> Parrainage
                  </h3>
                  <ReferralSystem compact />
                </div>
                {/* Notifications Push */}
                <div className={`rounded-[2rem] p-8 shadow-lg border ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-100'
                }`}>
                  <h3 className={`text-xl font-black flex items-center gap-3 mb-6 ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>
                    <Bell className="text-[#00ADEF]" /> Notifications
                  </h3>
                  <PushNotifications />
                </div>
                {/* Recent Orders */}
                <div className={`rounded-[2rem] p-8 shadow-lg border ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-100'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>
                      <ShoppingBag className="text-[#00ADEF]" /> Mes Commandes
                    </h3>
                    {userOrders.length > 0 && (
                      <Link href="/tracking" className="text-[#00ADEF] font-bold text-sm hover:underline">
                        Voir tout →
                      </Link>
                    )}
                  </div>
                  {userOrders.length > 0 ? (
                    <div className="space-y-4">
                      {userOrders.slice(0, 3).map((order) => (
                        <div key={order.id} className={`flex items-center justify-between p-4 rounded-xl ${
                          isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              order.status === 'Livré' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-[#00ADEF]'
                            }`}>
                              <ShoppingBag size={18} />
                            </div>
                            <div>
                              <p className={`font-bold ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>#{order.id.slice(0, 8).toUpperCase()}</p>
                              <p className={`text-xs flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Calendar size={12} />
                                {new Date(order.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-black ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>{order.total?.toLocaleString() || 0} F</p>
                            <span className={`text-xs font-bold ${
                              order.status === 'Livré' ? 'text-green-600' : 'text-[#00ADEF]'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                      <p>Aucune commande pour le moment</p>
                      <Link href="/catalog" className="text-[#00ADEF] font-bold text-sm hover:underline mt-2 inline-block">
                        Découvrir le catalogue →
                      </Link>
                    </div>
                  )}
                </div>
                {/* Favorites */}
                <div className={`rounded-[2rem] p-8 shadow-lg border ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-100'
                }`}>
                  <h3 className={`text-xl font-black flex items-center gap-3 mb-6 ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>
                    <Heart className="text-red-500" /> Mes Favoris
                    <span className={`text-sm font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({favoriteProducts.length} articles)</span>
                  </h3>
                  {favoriteProducts.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-6">
                      {favoriteProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Heart size={40} className="mx-auto mb-3 opacity-30" />
                      <p>Aucun favori pour le moment</p>
                      <Link href="/catalog" className="text-[#00ADEF] font-bold text-sm hover:underline mt-2 inline-block">
                        Découvrir le catalogue →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
