'use client';

import React, { ReactNode } from 'react';
import { RefreshCw, Snowflake } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
}) => {
  const { isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh,
    threshold,
  });

  return (
    <div className="relative">
      {/* Indicateur de pull */}
      <div 
        className="absolute left-0 right-0 flex justify-center items-center pointer-events-none z-50"
        style={{
          top: 0,
          height: pullDistance,
          opacity: progress,
          transition: isPulling ? 'none' : 'all 0.3s ease-out',
        }}
      >
        <div 
          className={`flex flex-col items-center justify-center gap-2 ${
            isRefreshing ? 'animate-pulse' : ''
          }`}
        >
          <div 
            className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#00ADEF] to-[#1E3A8A] flex items-center justify-center shadow-lg ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: `rotate(${progress * 360}deg) scale(${0.5 + progress * 0.5})`,
              transition: isPulling ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {isRefreshing ? (
              <RefreshCw size={20} className="text-white" />
            ) : (
              <Snowflake size={20} className="text-white" />
            )}
          </div>
          
          {progress >= 1 && !isRefreshing && (
            <span className="text-xs font-bold text-[#1E3A8A] dark:text-[#00ADEF] animate-pulse">
              Relâchez pour rafraîchir
            </span>
          )}
          
          {isRefreshing && (
            <span className="text-xs font-bold text-[#1E3A8A] dark:text-[#00ADEF]">
              Actualisation...
            </span>
          )}
        </div>
      </div>
      
      {/* Contenu */}
      <div 
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
