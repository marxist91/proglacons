'use client';

import React, { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[]; // Hauteurs en % (ex: [25, 50, 90])
  initialSnap?: number; // Index du snap initial
  showHandle?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [50, 90],
  initialSnap = 0,
  showHandle = true,
  showCloseButton = true,
  className = '',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { haptics } = useHaptics();
  const [currentHeight, setCurrentHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnap);
  const startY = useRef(0);
  const startHeight = useRef(0);

  // Convertir le snap point en hauteur
  const getSnapHeight = useCallback((snapIndex: number) => {
    return snapPoints[snapIndex] || snapPoints[0];
  }, [snapPoints]);

  // Ouvrir/Fermer
  useEffect(() => {
    if (isOpen) {
      const height = getSnapHeight(initialSnap);
      setCurrentHeight(height);
      setCurrentSnapIndex(initialSnap);
      document.body.style.overflow = 'hidden';
    } else {
      setCurrentHeight(0);
      document.body.style.overflow = '';
    }
  }, [isOpen, initialSnap, getSnapHeight]);

  // Trouver le snap point le plus proche
  const findClosestSnap = useCallback((height: number): number => {
    let closest = 0;
    let minDiff = Math.abs(height - snapPoints[0]);
    
    snapPoints.forEach((snap, index) => {
      const diff = Math.abs(height - snap);
      if (diff < minDiff) {
        minDiff = diff;
        closest = index;
      }
    });
    
    return closest;
  }, [snapPoints]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    startHeight.current = currentHeight;
    setIsDragging(true);
  }, [currentHeight]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const diff = startY.current - e.touches[0].clientY;
    const newHeight = startHeight.current + (diff / window.innerHeight) * 100;
    
    // Limiter entre 0 et le snap max
    const maxSnap = Math.max(...snapPoints);
    const clampedHeight = Math.max(0, Math.min(maxSnap + 10, newHeight));
    setCurrentHeight(clampedHeight);
  }, [isDragging, snapPoints]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Fermer si tiré trop bas
    if (currentHeight < snapPoints[0] / 2) {
      haptics.selection();
      onClose();
      return;
    }
    
    // Snap au point le plus proche
    const closestSnap = findClosestSnap(currentHeight);
    if (closestSnap !== currentSnapIndex) {
      haptics.selection();
    }
    setCurrentSnapIndex(closestSnap);
    setCurrentHeight(getSnapHeight(closestSnap));
  }, [isDragging, currentHeight, snapPoints, findClosestSnap, currentSnapIndex, haptics, onClose, getSnapHeight]);

  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen && currentHeight === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl ${className}`}
        style={{
          height: `${currentHeight}%`,
          transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '95vh',
        }}
      >
        {/* Handle area for dragging */}
        <div
          className="w-full pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {showHandle && (
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto" />
          )}
        </div>
        
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="px-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            {title && (
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto h-full pb-20 px-6">
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
