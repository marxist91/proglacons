'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useBackGesture } from '@/hooks/useBackGesture';

interface BackGestureIndicatorProps {
  enabled?: boolean;
  onBack?: () => void;
}

const BackGestureIndicator: React.FC<BackGestureIndicatorProps> = ({
  enabled = true,
  onBack,
}) => {
  const { isGesturing, swipeProgress } = useBackGesture({
    enabled,
    onBack,
  });

  if (!isGesturing) return null;

  return (
    <div 
      className="fixed left-0 top-1/2 -translate-y-1/2 z-[100] pointer-events-none"
      style={{
        opacity: swipeProgress,
        transform: `translateY(-50%) translateX(${swipeProgress * 30 - 30}px)`,
      }}
    >
      <div 
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-[#00ADEF] to-[#1E3A8A] flex items-center justify-center shadow-2xl transition-all ${
          swipeProgress >= 1 ? 'scale-110' : 'scale-100'
        }`}
        style={{
          boxShadow: swipeProgress >= 1 
            ? '0 0 30px rgba(0, 173, 239, 0.5)' 
            : '0 10px 30px rgba(0, 0, 0, 0.2)',
        }}
      >
        <ChevronLeft 
          size={28} 
          className={`text-white transition-transform ${
            swipeProgress >= 1 ? '-translate-x-0.5' : ''
          }`}
        />
      </div>
    </div>
  );
};

export default BackGestureIndicator;
