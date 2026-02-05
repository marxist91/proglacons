'use client';

import React from 'react';
import { Share2, MessageCircle, Facebook, Twitter, Link2, Check } from 'lucide-react';
import { Product } from '@/types';
import { useHaptics } from '@/hooks/useHaptics';
import { useState } from 'react';

interface SocialShareProps {
  product: Product;
  compact?: boolean;
}

const SocialShare: React.FC<SocialShareProps> = ({ product, compact = false }) => {
  const { haptics } = useHaptics();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/catalog?product=${product.id}` 
    : '';
  
  const shareText = `🧊 Découvrez ${product.name} chez PRO-GLAÇONS ! ${product.price.toLocaleString()} FCFA - Livraison rapide à Lomé`;

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  const handleShare = (url: string) => {
    haptics.buttonPress();
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      haptics.success();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      haptics.buttonPress();
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={handleNativeShare}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-[#00ADEF] hover:text-white flex items-center justify-center transition-all text-slate-500"
          title="Partager"
        >
          <Share2 size={18} />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-12 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-3 z-50 min-w-[200px] animate-fade-in">
            <div className="space-y-2">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => {
                    handleShare(option.url);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white ${option.color} transition-colors`}
                >
                  <option.icon size={18} />
                  <span className="font-medium">{option.name}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  handleCopyLink();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Link2 size={18} />}
                <span className="font-medium">{copied ? 'Copié !' : 'Copier le lien'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Share2 size={18} /> Partager ce produit
      </h4>
      
      <div className="flex flex-wrap gap-3">
        {shareOptions.map((option) => (
          <button
            key={option.name}
            onClick={() => handleShare(option.url)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-white ${option.color} transition-all transform hover:scale-105 shadow-lg`}
          >
            <option.icon size={20} />
            <span className="font-bold">{option.name}</span>
          </button>
        ))}
        
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300"
        >
          {copied ? <Check size={20} className="text-green-500" /> : <Link2 size={20} />}
          <span className="font-bold">{copied ? 'Copié !' : 'Copier le lien'}</span>
        </button>
      </div>
    </div>
  );
};

export default SocialShare;
