'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppWidget = () => {
  return (
    <a
      href="https://wa.me/22879747575"
      target="_blank"
      rel="noopener noreferrer"
      data-tour="whatsapp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 transition-transform animate-bounce focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
      aria-label="Contacter sur WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
};

export default WhatsAppWidget;
