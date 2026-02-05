'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ showLabel = false, size = 'md' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme, theme, setTheme } = useTheme();

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  
  const buttonClass = `
    relative p-2.5 rounded-xl transition-all duration-300
    ${resolvedTheme === 'dark' 
      ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' 
      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
    }
  `;

  return (
    <button
      onClick={toggleTheme}
      className={buttonClass}
      aria-label={`Passer en mode ${resolvedTheme === 'dark' ? 'clair' : 'sombre'}`}
      title={`Mode ${resolvedTheme === 'dark' ? 'clair' : 'sombre'}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun 
          size={iconSize} 
          className={`absolute transition-all duration-300 ${
            resolvedTheme === 'dark' 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        {/* Moon Icon */}
        <Moon 
          size={iconSize} 
          className={`absolute transition-all duration-300 ${
            resolvedTheme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </div>
      
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}
        </span>
      )}
    </button>
  );
}

// Version avec menu déroulant pour choisir light/dark/system
export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const options = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor },
  ] as const;

  const currentOption = options.find(o => o.value === theme) || options[2];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl transition-all
          ${resolvedTheme === 'dark' 
            ? 'bg-slate-800 hover:bg-slate-700 text-white' 
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }
        `}
      >
        <CurrentIcon size={18} />
        <span className="text-sm font-medium">{currentOption.label}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className={`
            absolute right-0 mt-2 w-40 rounded-xl shadow-xl z-50 overflow-hidden
            ${resolvedTheme === 'dark' 
              ? 'bg-slate-800 border border-slate-700' 
              : 'bg-white border border-slate-200'
            }
          `}>
            {options.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                    ${isActive 
                      ? resolvedTheme === 'dark'
                        ? 'bg-[#00ADEF]/20 text-[#00ADEF]'
                        : 'bg-[#00ADEF]/10 text-[#00ADEF]'
                      : resolvedTheme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon size={16} />
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
