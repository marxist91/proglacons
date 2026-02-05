'use client';

import React, { useState, useEffect, useRef, useCallback, memo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// ========================================
// Lazy Loading Image Component
// ========================================
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: 'blur' | 'skeleton' | 'none';
  blurDataURL?: string;
  onLoad?: () => void;
  priority?: boolean;
  aspectRatio?: string;
}

export const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  className = '',
  placeholder = 'skeleton',
  blurDataURL,
  onLoad,
  priority = false,
  aspectRatio = '1/1',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  const placeholderContent = () => {
    if (placeholder === 'blur' && blurDataURL) {
      return (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center filter blur-lg scale-105"
          style={{ backgroundImage: `url(${blurDataURL})` }}
          aria-hidden="true"
        />
      );
    }
    if (placeholder === 'skeleton') {
      return (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
      );
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}
      style={{ aspectRatio }}
    >
      {!isLoaded && !error && placeholderContent()}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-700">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {isInView && !error && (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          className={`object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

// ========================================
// Lazy Component Loader
// ========================================
interface LazyComponentProps {
  loader: () => Promise<{ default: React.ComponentType<unknown> }>;
  fallback?: React.ReactNode;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  loader,
  fallback = <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg h-32" />,
}) => {
  const Component = dynamic(loader, {
    loading: () => <>{fallback}</>,
    ssr: false,
  });

  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
};

// ========================================
// Virtualized List
// ========================================
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================================
// Debounced Value Hook
// ========================================
export const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// ========================================
// Throttled Callback Hook (simplified)
// ========================================
export function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(0);

  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRan.current >= delay) {
        lastRan.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  ) as T;

  return throttledFn;
}

// ========================================
// Intersection Observer Hook
// ========================================
export const useInView = (options?: IntersectionObserverInit) => {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasBeenInView(true);
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView, hasBeenInView };
};

// ========================================
// Prefetch Links
// ========================================
interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  href,
  children,
  className = '',
}) => {
  const handleMouseEnter = useCallback(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }, [href]);

  return (
    <a
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </a>
  );
};

// ========================================
// Image Preloader
// ========================================
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = (srcs: string[]): Promise<void[]> => {
  return Promise.all(srcs.map(preloadImage));
};

// ========================================
// Resource Hints Component
// ========================================
interface ResourceHintsProps {
  preconnect?: string[];
  dnsPrefetch?: string[];
  preload?: Array<{ href: string; as: string; type?: string }>;
}

export const ResourceHints: React.FC<ResourceHintsProps> = ({
  preconnect = [],
  dnsPrefetch = [],
  preload = [],
}) => {
  useEffect(() => {
    preconnect.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      document.head.appendChild(link);
    });

    dnsPrefetch.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = href;
      document.head.appendChild(link);
    });

    preload.forEach(({ href, as, type }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      if (type) link.type = type;
      document.head.appendChild(link);
    });
  }, [preconnect, dnsPrefetch, preload]);

  return null;
};

// ========================================
// Code Splitting Helper
// ========================================
export const createLazyComponent = <T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: React.ReactNode;
    ssr?: boolean;
  }
) => {
  return dynamic(importFn, {
    loading: () => <>{options?.loading || <div className="animate-pulse h-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />}</>,
    ssr: options?.ssr ?? false,
  });
};

// ========================================
// Progressive Enhancement
// ========================================
export const useProgressiveEnhancement = () => {
  const [isEnhanced, setIsEnhanced] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsEnhanced(true), 0);
    return () => clearTimeout(timer);
  }, []);
  
  return isEnhanced;
};

// Export all
const PerformanceUtils = {
  LazyImage,
  LazyComponent,
  VirtualList,
  useDebouncedValue,
  useThrottledCallback,
  useInView,
  PrefetchLink,
  preloadImage,
  preloadImages,
  ResourceHints,
  createLazyComponent,
  useProgressiveEnhancement,
};

export default PerformanceUtils;
