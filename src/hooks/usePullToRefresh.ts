'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useHaptics } from './useHaptics';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Distance en px pour déclencher le refresh
  resistance?: number; // Résistance au pull (0-1)
  maxPull?: number; // Distance max de pull en px
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 0.5,
  maxPull = 150,
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const { haptics } = useHaptics();
  const hasTriggeredHaptic = useRef(false);

  const canPull = useCallback(() => {
    // Ne peut tirer que si on est tout en haut de la page
    return window.scrollY <= 0;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!canPull() || isRefreshing) return;
    startY.current = e.touches[0].clientY;
    hasTriggeredHaptic.current = false;
  }, [canPull, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!canPull() || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      setIsPulling(true);
      // Appliquer la résistance
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
      
      // Haptic feedback quand on atteint le seuil
      if (distance >= threshold && !hasTriggeredHaptic.current) {
        haptics.pullRefresh();
        hasTriggeredHaptic.current = true;
      } else if (distance < threshold) {
        hasTriggeredHaptic.current = false;
      }
      
      // Empêcher le scroll natif
      if (diff > 10) {
        e.preventDefault();
      }
    }
  }, [canPull, isRefreshing, resistance, maxPull, threshold, haptics]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Garder visible pendant le refresh
      
      try {
        await onRefresh();
        haptics.success();
      } catch (e) {
        haptics.error();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, onRefresh, haptics]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    progress,
  };
}

export default usePullToRefresh;
