'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ========================================
// Skip to Content Link
// ========================================
export const SkipToContent: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#00ADEF] focus:text-white focus:rounded-lg focus:font-semibold focus:outline-none focus:ring-2 focus:ring-white"
    >
      Aller au contenu principal
    </a>
  );
};

// ========================================
// Focus Trap for Modals
// ========================================
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  returnFocus?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  returnFocus = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    previousActiveElement.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, returnFocus]);

  return <div ref={containerRef}>{children}</div>;
};

// ========================================
// Announce for Screen Readers
// ========================================
let announceTimeout: NodeJS.Timeout | null = null;

export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  // Clear previous timeout
  if (announceTimeout) clearTimeout(announceTimeout);

  // Create or get live region
  let liveRegion = document.getElementById('a11y-announcer');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-announcer';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  liveRegion.setAttribute('aria-live', priority);
  liveRegion.textContent = '';

  // Announce after brief delay for screen readers
  announceTimeout = setTimeout(() => {
    if (liveRegion) liveRegion.textContent = message;
  }, 100);
};

// Hook for announcing
export const useAnnounce = () => {
  return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announce(message, priority);
  }, []);
};

// ========================================
// Keyboard Navigation Shortcuts
// ========================================
interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Protection contre les événements avec key undefined
      if (!e.key) return;
      
      for (const shortcut of shortcuts) {
        if (!shortcut.key) continue;
        
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// ========================================
// Reduced Motion Hook
// ========================================
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

// ========================================
// High Contrast Mode Detection
// ========================================
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(forced-colors: active)');
    setIsHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isHighContrast;
};

// ========================================
// Accessible Icon Button
// ========================================
interface A11yIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  srLabel?: string;
}

export const A11yIconButton: React.FC<A11yIconButtonProps> = ({
  icon,
  label,
  srLabel,
  className = '',
  ...props
}) => {
  return (
    <button
      aria-label={srLabel || label}
      title={label}
      className={`relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADEF] focus-visible:ring-offset-2 rounded-lg ${className}`}
      {...props}
    >
      {icon}
      <span className="sr-only">{srLabel || label}</span>
    </button>
  );
};

// ========================================
// Roving Tabindex for Lists/Grids
// ========================================
export const useRovingTabindex = <T extends HTMLElement>(itemCount: number) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(T | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = (index + 1) % itemCount;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = (index - 1 + itemCount) % itemCount;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = itemCount - 1;
          break;
        default:
          return;
      }

      setFocusedIndex(nextIndex);
      itemRefs.current[nextIndex]?.focus();
    },
    [itemCount]
  );

  const getItemProps = (index: number) => ({
    tabIndex: index === focusedIndex ? 0 : -1,
    onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
    ref: (el: T | null) => {
      itemRefs.current[index] = el;
    },
  });

  return { focusedIndex, setFocusedIndex, getItemProps };
};

// ========================================
// Accessible Modal
// ========================================
interface A11yModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const A11yModal: React.FC<A11yModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <FocusTrap active={isOpen}>
        <div
          ref={modalRef}
          className={`relative w-full ${sizeClasses[size]} bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--card-border)] animate-fade-in`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
            <h2 id="modal-title" className="text-lg font-bold text-[var(--foreground)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADEF]"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4">{children}</div>
        </div>
      </FocusTrap>
    </div>
  );
};

// ========================================
// Screen Reader Only Text
// ========================================
export const SrOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// ========================================
// Landmark Navigation
// ========================================
export const useGlobalA11yShortcuts = () => {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: '1',
      alt: true,
      description: 'Aller à l\'accueil',
      action: () => router.push('/'),
    },
    {
      key: '2',
      alt: true,
      description: 'Aller au catalogue',
      action: () => router.push('/catalog'),
    },
    {
      key: '3',
      alt: true,
      description: 'Aller aux services',
      action: () => router.push('/services'),
    },
    {
      key: '4',
      alt: true,
      description: 'Aller au profil',
      action: () => router.push('/profile'),
    },
    {
      key: 's',
      ctrl: true,
      description: 'Rechercher',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search]');
        searchInput?.focus();
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
};

// ========================================
// Contrast Checker (Development Tool)
// ========================================
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (rgb: number[]): number => {
    const [r, g, b] = rgb.map(c => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const hexToRgb = (hex: string): number[] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
  };

  const l1 = getLuminance(hexToRgb(color1));
  const l2 = getLuminance(hexToRgb(color2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

export const meetsWCAG = (ratio: number, level: 'AA' | 'AAA' = 'AA', isLargeText = false): boolean => {
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

export default {
  SkipToContent,
  FocusTrap,
  announce,
  useAnnounce,
  useKeyboardShortcuts,
  useReducedMotion,
  useHighContrast,
  A11yIconButton,
  useRovingTabindex,
  A11yModal,
  SrOnly,
  useGlobalA11yShortcuts,
  getContrastRatio,
  meetsWCAG,
};
