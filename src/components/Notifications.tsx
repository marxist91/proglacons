'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/lib/context';

const Notifications = () => {
  const { notifications } = useApp();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-[100] w-full max-w-sm space-y-4 pointer-events-none">
      {notifications.map(n => (
        <div 
          key={n.id} 
          className={`pointer-events-auto shadow-2xl rounded-2xl border-l-4 p-5 flex gap-4 items-start bg-white ${
            n.type === 'success' ? 'border-emerald-500' : 
            n.type === 'error' ? 'border-red-500' : 
            n.type === 'warning' ? 'border-amber-500' : 
            'border-[#00ADEF]'
          }`}
        >
          <div className="flex-1">
            <h5 className="text-sm font-black text-[#1E3A8A] uppercase">{n.title}</h5>
            <p className="text-xs text-slate-500">{n.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
