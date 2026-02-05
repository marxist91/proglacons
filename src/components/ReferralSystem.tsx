'use client';

import React, { useState, useMemo } from 'react';
import { Users, Gift, Copy, Check, Share2, Trophy, Sparkles } from 'lucide-react';
import { Referral, ReferralConfig } from '@/types';
import { useApp } from '@/lib/context';
import { useHaptics } from '@/hooks/useHaptics';

// Configuration du parrainage
const REFERRAL_CONFIG: ReferralConfig = {
  referrer_bonus: 100, // Points pour le parrain
  referee_bonus: 50,   // Points pour le filleul
  min_order_amount: 5000, // Montant min pour valider
  expiry_days: 30,
};

// Générer un code de parrainage
const generateReferralCode = (userId: string): string => {
  const prefix = 'PRO';
  const userPart = userId.slice(0, 2).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${userPart}${random}`;
};

interface ReferralSystemProps {
  compact?: boolean;
}

const ReferralSystem: React.FC<ReferralSystemProps> = ({ compact = false }) => {
  const { user } = useApp();
  const { haptics } = useHaptics();
  const [copied, setCopied] = useState(false);

  // Générer ou récupérer le code de parrainage de manière synchrone
  const referralCode = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const savedCode = localStorage.getItem('proglacons_referral_code');
    if (savedCode) return savedCode;
    const newCode = generateReferralCode(user?.id || 'guest');
    localStorage.setItem('proglacons_referral_code', newCode);
    return newCode;
  }, [user?.id]);

  // Données de parrainage (simulées)
  const referrals = useMemo<Referral[]>(() => [
    {
      id: '1',
      referrer_id: user?.id || 'guest',
      referrer_name: user?.full_name || 'Vous',
      referee_id: 'user2',
      referee_name: 'Kwame A.',
      referral_code: referralCode,
      status: 'completed',
      bonus_points: 100,
      created_at: '2026-01-15T10:00:00Z',
      completed_at: '2026-01-16T14:30:00Z',
    },
    {
      id: '2',
      referrer_id: user?.id || 'guest',
      referrer_name: user?.full_name || 'Vous',
      referee_name: 'Afi M.',
      referral_code: referralCode,
      status: 'pending',
      bonus_points: 100,
      created_at: '2026-01-28T09:15:00Z',
    },
  ], [user?.id, user?.full_name, referralCode]);

  const stats = useMemo(() => ({
    total: 5,
    completed: 3,
    pending: 2,
    points: 300,
  }), []);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${referralCode}`
    : '';

  const shareText = `🧊 Rejoins PRO-GLAÇONS et obtiens ${REFERRAL_CONFIG.referee_bonus} points bonus avec mon code : ${referralCode} ! Glaçons premium livrés rapidement à Lomé.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      haptics.success();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    haptics.buttonPress();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PRO-GLAÇONS - Parrainage',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      // Fallback to WhatsApp
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_blank');
    }
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Gift size={24} />
          </div>
          <div>
            <h3 className="font-bold">Parrainez vos amis</h3>
            <p className="text-xs text-white/80">Gagnez {REFERRAL_CONFIG.referrer_bonus} points par ami</p>
          </div>
        </div>

        <div className="bg-white/20 rounded-xl p-3 flex items-center justify-between mb-4">
          <span className="font-mono font-bold text-lg">{referralCode}</span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-3 rounded-xl bg-white text-purple-600 font-bold flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
        >
          <Share2 size={18} /> Partager mon code
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Users size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black">Programme Parrainage</h2>
              <p className="text-white/80">Invitez vos amis, gagnez des points !</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Gift size={24} className="mx-auto mb-2" />
              <p className="text-3xl font-black">{REFERRAL_CONFIG.referrer_bonus}</p>
              <p className="text-xs text-white/80">Points pour vous</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Sparkles size={24} className="mx-auto mb-2" />
              <p className="text-3xl font-black">{REFERRAL_CONFIG.referee_bonus}</p>
              <p className="text-xs text-white/80">Points pour l&apos;ami</p>
            </div>
          </div>
        </div>
      </div>

      {/* Code de parrainage */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white mb-4">Votre code de parrainage</h3>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-4 text-center">
            <span className="font-mono text-2xl font-black text-[#1E3A8A] dark:text-[#00ADEF] tracking-widest">{referralCode}</span>
          </div>
          <button
            onClick={handleCopy}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
              copied ? 'bg-green-500 text-white' : 'bg-[#1E3A8A] text-white hover:bg-[#00ADEF]'
            }`}
          >
            {copied ? <Check size={24} /> : <Copy size={24} />}
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
        >
          <Share2 size={20} /> Inviter un ami
        </button>
      </div>

      {/* Statistiques */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" /> Vos statistiques
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
            <p className="text-2xl font-black text-[#1E3A8A] dark:text-white">{stats.total}</p>
            <p className="text-xs text-slate-500">Invitations</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p className="text-2xl font-black text-green-600">{stats.completed}</p>
            <p className="text-xs text-slate-500">Validées</p>
          </div>
          <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
            <p className="text-xs text-slate-500">En attente</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <p className="text-2xl font-black text-purple-600">{stats.points}</p>
            <p className="text-xs text-slate-500">Points gagnés</p>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white mb-4">Historique des parrainages</h3>
        
        <div className="space-y-3">
          {referrals.map((referral) => (
            <div
              key={referral.id}
              className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white font-bold">
                {referral.referee_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-700 dark:text-white">{referral.referee_name || 'En attente'}</p>
                <p className="text-xs text-slate-400">
                  {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                referral.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : referral.status === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {referral.status === 'completed' ? `+${referral.bonus_points} pts` : 'En attente'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
        <h3 className="font-bold text-slate-700 dark:text-white mb-4">Comment ça marche ?</h3>
        
        <div className="space-y-4">
          {[
            { step: 1, title: 'Partagez votre code', desc: 'Envoyez votre code à vos amis' },
            { step: 2, title: 'Ils passent commande', desc: `Min ${REFERRAL_CONFIG.min_order_amount.toLocaleString()} FCFA` },
            { step: 3, title: 'Vous gagnez tous les deux', desc: 'Points crédités automatiquement !' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#00ADEF] text-white font-black flex items-center justify-center">
                {item.step}
              </div>
              <div>
                <p className="font-bold text-slate-700 dark:text-white">{item.title}</p>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReferralSystem;
