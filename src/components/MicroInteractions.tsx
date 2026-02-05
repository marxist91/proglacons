'use client';

import React, { useState, useCallback } from 'react';

// Bouton avec micro-interaction de ripple et scale
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { x, y, id }]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);

    onClick?.(e);
  }, [onClick]);

  const variantStyles = {
    primary: 'bg-[#00ADEF] hover:bg-[#0095d0] text-white',
    secondary: 'bg-[#1E3A8A] hover:bg-[#1e3a8a]/90 text-white',
    outline: 'border-2 border-[#00ADEF] text-[#00ADEF] hover:bg-[#00ADEF]/10',
    ghost: 'text-[#00ADEF] hover:bg-[#00ADEF]/10',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-base rounded-xl',
    lg: 'px-7 py-3.5 text-lg rounded-2xl',
  };

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden font-semibold transition-all duration-300 transform active:scale-95 hover:scale-[1.02] hover:shadow-lg ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </button>
  );
};

// Icône avec animation de rebond
interface BounceIconProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const BounceIcon: React.FC<BounceIconProps> = ({
  children,
  active = false,
  onClick,
  className = '',
}) => {
  const [bouncing, setBouncing] = useState(false);

  const handleClick = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 400);
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer transition-all duration-300 ${bouncing ? 'animate-bounce-icon' : ''} ${active ? 'scale-110 text-[#00ADEF]' : 'hover:scale-110 hover:text-[#00ADEF]'} ${className}`}
    >
      {children}
    </div>
  );
};

// Badge avec animation de pulse
interface PulseBadgeProps {
  count: number;
  className?: string;
}

export const PulseBadge: React.FC<PulseBadgeProps> = ({ count, className = '' }) => {
  if (count === 0) return null;

  return (
    <span
      className={`absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full animate-pulse-badge ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

// Compteur animé
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 500,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutCubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={`tabular-nums transition-all ${className}`}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

// Skeleton loader animé
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  return (
    <div
      className={`bg-slate-200 dark:bg-slate-700 animate-shimmer ${variantStyles[variant]} ${className}`}
      style={{
        width: width || (variant === 'circular' ? height : '100%'),
        height: height || (variant === 'text' ? undefined : '100%'),
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        backgroundSize: '200% 100%',
      }}
    />
  );
};

// Card avec effet hover 3D
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  intensity = 10,
}) => {
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateY = ((x - centerX) / centerX) * intensity;
    const rotateX = ((centerY - y) / centerY) * intensity;
    
    setTransform({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  );
};

// Floating action button avec animation
interface FloatingActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  children,
  onClick,
  className = '',
  position = 'bottom-right',
}) => {
  const positionStyles = {
    'bottom-right': 'right-4 bottom-24',
    'bottom-left': 'left-4 bottom-24',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-24',
  };

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionStyles[position]} w-14 h-14 rounded-full bg-[#00ADEF] text-white shadow-lg shadow-[#00ADEF]/30 flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all duration-300 animate-float z-40 ${className}`}
    >
      {children}
    </button>
  );
};

// Progress bar animé
interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  className = '',
  showLabel = false,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#00ADEF] to-[#1E3A8A] rounded-full transition-all duration-500 ease-out animate-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="absolute -top-6 right-0 text-sm font-medium text-[var(--foreground-muted)]">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

// Checkbox animé
interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  label,
  className = '',
}) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer group ${className}`}>
      <div
        onClick={() => onChange(!checked)}
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
          checked
            ? 'bg-[#00ADEF] border-[#00ADEF] scale-95'
            : 'border-slate-300 dark:border-slate-600 group-hover:border-[#00ADEF]'
        }`}
      >
        <svg
          className={`w-4 h-4 text-white transition-all duration-300 ${
            checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      {label && (
        <span className="text-[var(--foreground)] group-hover:text-[#00ADEF] transition-colors">
          {label}
        </span>
      )}
    </label>
  );
};

export default {
  RippleButton,
  BounceIcon,
  PulseBadge,
  AnimatedCounter,
  Skeleton,
  TiltCard,
  FloatingActionButton,
  AnimatedProgress,
  AnimatedCheckbox,
};
