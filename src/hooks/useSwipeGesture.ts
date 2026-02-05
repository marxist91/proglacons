'use client';

import { useState, useRef, useCallback, TouchEvent } from 'react';
import { useHaptics } from './useHaptics';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Distance min pour déclencher
  maxSwipe?: number; // Distance max de swipe
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  maxSwipe = 150,
}: SwipeGestureOptions = {}) {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const { haptics } = useHaptics();
  const hasTriggeredHaptic = useRef(false);
  const isHorizontalSwipe = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setIsSwiping(false);
    isHorizontalSwipe.current = false;
    hasTriggeredHaptic.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const diffX = e.touches[0].clientX - startX.current;
    const diffY = e.touches[0].clientY - startY.current;
    
    // Déterminer si c'est un swipe horizontal
    if (!isHorizontalSwipe.current && Math.abs(diffX) > 10) {
      isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
    }
    
    if (isHorizontalSwipe.current) {
      setIsSwiping(true);
      // Limiter la distance de swipe
      const clampedDistance = Math.max(-maxSwipe, Math.min(maxSwipe, diffX));
      setSwipeDistance(clampedDistance);
      
      // Haptic feedback au seuil
      if (Math.abs(clampedDistance) >= threshold && !hasTriggeredHaptic.current) {
        haptics.swipe();
        hasTriggeredHaptic.current = true;
      }
    }
  }, [maxSwipe, threshold, haptics]);

  const handleTouchEnd = useCallback(() => {
    if (isSwiping) {
      if (swipeDistance <= -threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (swipeDistance >= threshold && onSwipeRight) {
        onSwipeRight();
      }
    }
    
    setSwipeDistance(0);
    setIsSwiping(false);
  }, [isSwiping, swipeDistance, threshold, onSwipeLeft, onSwipeRight]);

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  const getSwipeStyle = () => ({
    transform: `translateX(${swipeDistance}px)`,
    transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
  });

  const swipeProgress = Math.abs(swipeDistance) / threshold;
  const swipeDirection = swipeDistance > 0 ? 'right' : swipeDistance < 0 ? 'left' : null;

  return {
    handlers,
    swipeDistance,
    isSwiping,
    getSwipeStyle,
    swipeProgress,
    swipeDirection,
  };
}

export default useSwipeGesture;
