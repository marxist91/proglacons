'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHaptics } from './useHaptics';

interface BackGestureOptions {
  enabled?: boolean;
  edgeWidth?: number; // Largeur de la zone edge en px
  threshold?: number; // Distance min pour déclencher
  onBack?: () => void; // Custom back handler
}

export function useBackGesture({
  enabled = true,
  edgeWidth = 30,
  threshold = 100,
  onBack,
}: BackGestureOptions = {}) {
  const router = useRouter();
  const { haptics } = useHaptics();
  const startX = useRef(0);
  const startY = useRef(0);
  const isFromEdge = useRef(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isGesturing, setIsGesturing] = useState(false);
  const hasTriggeredHaptic = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    
    // Vérifier si le touch commence depuis le bord gauche
    isFromEdge.current = touch.clientX <= edgeWidth;
    hasTriggeredHaptic.current = false;
    
    if (isFromEdge.current) {
      setIsGesturing(true);
    }
  }, [enabled, edgeWidth]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isFromEdge.current) return;
    
    const touch = e.touches[0];
    const diffX = touch.clientX - startX.current;
    const diffY = Math.abs(touch.clientY - startY.current);
    
    // Annuler si le mouvement est plus vertical qu'horizontal
    if (diffY > Math.abs(diffX)) {
      isFromEdge.current = false;
      setIsGesturing(false);
      setSwipeProgress(0);
      return;
    }
    
    if (diffX > 0) {
      const progress = Math.min(diffX / threshold, 1);
      setSwipeProgress(progress);
      
      // Haptic au seuil
      if (progress >= 1 && !hasTriggeredHaptic.current) {
        haptics.selection();
        hasTriggeredHaptic.current = true;
      }
      
      // Empêcher le comportement par défaut pour swipe depuis le bord
      if (diffX > 20) {
        e.preventDefault();
      }
    }
  }, [enabled, threshold, haptics]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isFromEdge.current) return;
    
    if (swipeProgress >= 1) {
      haptics.success();
      if (onBack) {
        onBack();
      } else {
        router.back();
      }
    }
    
    setIsGesturing(false);
    setSwipeProgress(0);
    isFromEdge.current = false;
  }, [enabled, swipeProgress, haptics, onBack, router]);

  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isGesturing,
    swipeProgress,
  };
}

export default useBackGesture;
