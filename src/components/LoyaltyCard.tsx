'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, Gift, ChevronRight, Trophy, Zap, 
  TrendingUp, Clock, CheckCircle, Award, Sparkles 
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { LoyaltyPoints, LoyaltyTransaction, LOYALTY_CONFIG } from '@/types';

interface LoyaltyCardProps {
  userId: string;
  onRedeemPoints?: (points: number, discount: number) => void;
  compact?: boolean;
}

export default function LoyaltyCard({ userId, onRedeemPoints, compact = false }: LoyaltyCardProps) {
  const [account, setAccount] = useState<LoyaltyPoints | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (userId) {
      loadLoyaltyData();
    }
  }, [userId]);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      const [pointsData, transactionsData] = await Promise.all([
        db.loyalty.getPoints(userId),
        db.loyalty.getTransactions(userId)
      ]);
      setAccount(pointsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (pointsRequired: number, discountValue: number) => {
    if (!account || account.points < pointsRequired) return;
    
    try {
      setRedeeming(true);
      await db.loyalty.redeemPoints(userId, pointsRequired, discountValue);
      await loadLoyaltyData();
      onRedeemPoints?.(pointsRequired, discountValue);
    } catch (error) {
      console.error('Error redeeming points:', error);
    } finally {
      setRedeeming(false);
    }
  };

  const getTierInfo = (tier: string) => {
    return LOYALTY_CONFIG.TIERS[tier as keyof typeof LOYALTY_CONFIG.TIERS] || LOYALTY_CONFIG.TIERS.bronze;
  };

  const getNextTier = () => {
    if (!account) return null;
    const tiers = Object.entries(LOYALTY_CONFIG.TIERS);
    const currentIndex = tiers.findIndex(([key]) => key === account.tier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  const getProgressToNextTier = () => {
    if (!account) return 0;
    const nextTier = getNextTier();
    if (!nextTier) return 100;
    
    const currentTierInfo = getTierInfo(account.tier);
    const nextTierMin = nextTier[1].min;
    const progress = ((account.total_earned - currentTierInfo.min) / (nextTierMin - currentTierInfo.min)) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 animate-pulse">
        <div className="h-20 bg-slate-700 rounded-2xl" />
      </div>
    );
  }

  if (!account) return null;

  const tierInfo = getTierInfo(account.tier);
  const nextTier = getNextTier();

  // Version compacte pour le header ou le panier
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${tierInfo.color}20` }}
          >
            <Star className="text-amber-500" size={20} fill="currentColor" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{account.points} points</div>
            <div className="text-xs text-slate-400">Niveau {tierInfo.name}</div>
          </div>
        </div>
        <button className="text-amber-500 hover:text-amber-400 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  // Version complète
  return (
    <div className="space-y-6">
      {/* Carte principale */}
      <div 
        className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${tierInfo.color}15 0%, ${tierInfo.color}05 100%)`,
          border: `1px solid ${tierInfo.color}30`
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Trophy size={128} style={{ color: tierInfo.color }} />
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award size={20} style={{ color: tierInfo.color }} />
                <span 
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: tierInfo.color }}
                >
                  Niveau {tierInfo.name}
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white">
                {account.points.toLocaleString()}
                <span className="text-lg font-medium text-slate-400 ml-2">points</span>
              </h3>
            </div>
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ 
                backgroundColor: tierInfo.color,
                boxShadow: `0 10px 30px ${tierInfo.color}40`
              }}
            >
              <Star className="text-white" size={32} fill="white" />
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Prochain niveau : {nextTier[1].name}</span>
                <span>{nextTier[1].min - account.total_earned} pts restants</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${getProgressToNextTier()}%`,
                    backgroundColor: tierInfo.color
                  }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <TrendingUp size={16} className="text-emerald-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{account.total_earned}</div>
              <div className="text-[10px] text-slate-500 uppercase">Total gagné</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Gift size={16} className="text-purple-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{account.total_spent}</div>
              <div className="text-[10px] text-slate-500 uppercase">Utilisés</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Zap size={16} style={{ color: tierInfo.color }} className="mx-auto mb-1" />
              <div className="text-lg font-bold text-white">x{tierInfo.multiplier}</div>
              <div className="text-[10px] text-slate-500 uppercase">Bonus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Récompenses disponibles */}
      <div className="bg-slate-800/50 rounded-[2rem] p-6 border border-slate-700/50">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Gift className="text-purple-400" size={20} />
          Échanger mes points
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {LOYALTY_CONFIG.REWARDS.map((reward) => {
            const canRedeem = account.points >= reward.points;
            return (
              <button
                key={reward.points}
                onClick={() => canRedeem && handleRedeem(reward.points, reward.discount)}
                disabled={!canRedeem || redeeming}
                className={`p-4 rounded-2xl text-left transition-all ${
                  canRedeem 
                    ? 'bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/50 hover:scale-[1.02]' 
                    : 'bg-slate-700/30 border border-slate-700/50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`text-lg font-black ${canRedeem ? 'text-purple-400' : 'text-slate-500'}`}>
                  -{reward.discount.toLocaleString()} F
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  <span className={canRedeem ? 'text-amber-400' : 'text-slate-500'}>
                    {reward.points} pts
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Historique */}
      <div className="bg-slate-800/50 rounded-[2rem] p-6 border border-slate-700/50">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-white"
        >
          <h4 className="text-lg font-bold flex items-center gap-2">
            <Clock className="text-blue-400" size={20} />
            Historique
          </h4>
          <ChevronRight 
            size={20} 
            className={`text-slate-400 transition-transform ${showHistory ? 'rotate-90' : ''}`} 
          />
        </button>
        
        {showHistory && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Aucune transaction</p>
            ) : (
              transactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {tx.type === 'earn' && <TrendingUp size={16} className="text-emerald-400" />}
                    {tx.type === 'redeem' && <Gift size={16} className="text-purple-400" />}
                    {tx.type === 'bonus' && <Sparkles size={16} className="text-amber-400" />}
                    {tx.type === 'expire' && <Clock size={16} className="text-red-400" />}
                    <div>
                      <div className="text-sm text-white">{tx.description}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Info sur le système */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="text-blue-400 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-slate-400">
            <p className="font-medium text-white mb-1">Comment ça marche ?</p>
            <ul className="space-y-1">
              <li>• Gagnez <span className="text-amber-400">10 points</span> pour chaque 1 000 FCFA dépensés</li>
              <li>• Montez de niveau pour gagner jusqu'à <span className="text-emerald-400">2x plus</span> de points</li>
              <li>• Échangez vos points contre des réductions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
