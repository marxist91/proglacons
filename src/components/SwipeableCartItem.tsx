'use client';

import React, { ReactNode } from 'react';
import { Trash2, Heart } from 'lucide-react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface SwipeableCartItemProps {
  children: ReactNode;
  onDelete: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

const SwipeableCartItem: React.FC<SwipeableCartItemProps> = ({
  children,
  onDelete,
  onFavorite,
  isFavorite = false,
}) => {
  const { handlers, swipeDistance, isSwiping, getSwipeStyle, swipeProgress, swipeDirection } = useSwipeGesture({
    onSwipeLeft: onDelete,
    onSwipeRight: onFavorite,
    threshold: 80,
    maxSwipe: 120,
  });

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Actions background - gauche (favoris) */}
      {onFavorite && (
        <div 
          className={`absolute inset-y-0 left-0 w-24 flex items-center justify-center transition-colors ${
            swipeDirection === 'right' && swipeProgress >= 1 
              ? isFavorite ? 'bg-slate-400' : 'bg-red-500' 
              : isFavorite ? 'bg-slate-300' : 'bg-red-400'
          }`}
          style={{
            opacity: swipeDirection === 'right' ? swipeProgress : 0,
          }}
        >
          <Heart 
            size={24} 
            className={`text-white transition-transform ${
              swipeProgress >= 1 ? 'scale-125' : 'scale-100'
            } ${isFavorite ? 'fill-current' : ''}`}
          />
        </div>
      )}
      
      {/* Actions background - droite (supprimer) */}
      <div 
        className={`absolute inset-y-0 right-0 w-24 flex items-center justify-center transition-colors ${
          swipeDirection === 'left' && swipeProgress >= 1 ? 'bg-red-600' : 'bg-red-500'
        }`}
        style={{
          opacity: swipeDirection === 'left' ? swipeProgress : 0,
        }}
      >
        <Trash2 
          size={24} 
          className={`text-white transition-transform ${
            swipeProgress >= 1 ? 'scale-125' : 'scale-100'
          }`}
        />
      </div>
      
      {/* Contenu swipeable */}
      <div 
        {...handlers}
        className="relative bg-white dark:bg-slate-800 touch-pan-y"
        style={getSwipeStyle()}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCartItem;
