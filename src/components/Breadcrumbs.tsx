'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <nav className="flex items-center gap-2 text-sm mb-8">
      <Link 
        href="/"
        className={`flex items-center gap-1 hover:text-[#00ADEF] transition-colors ${
          isDark ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        <Home size={14} />
        <span>Accueil</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
          {item.href ? (
            <Link 
              href={item.href}
              className={`hover:text-[#00ADEF] transition-colors font-medium ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {item.label}
            </Link>
          ) : (
            <span className={`font-bold uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-[#1E3A8A]'
            }`}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
