'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Zap, Wifi } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installé
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Détecter iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Écouter l'événement d'installation
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Afficher la bannière après 3 secondes si pas déjà installé
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed && !standalone) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Pour iOS, afficher les instructions manuelles
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('App installed');
    }
    
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Ne rien afficher si déjà installé
  if (isStandalone || !showInstallBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] animate-slide-up">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 shadow-2xl border border-slate-700/50 backdrop-blur-xl">
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-14 h-14 bg-gradient-to-br from-[#00ADEF] to-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
            <Smartphone className="text-white" size={28} />
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">
              Installer l'application
            </h3>
            <p className="text-slate-400 text-sm mb-3">
              Accédez à PRO-GLAÇONS comme une vraie app !
            </p>
            
            {/* Benefits */}
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Zap size={12} className="text-amber-400" />
                <span>Plus rapide</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Wifi size={12} className="text-emerald-400" />
                <span>Mode hors-ligne</span>
              </div>
            </div>
            
            {isIOS ? (
              // Instructions iOS
              <div className="bg-slate-800/50 rounded-xl p-3 text-xs text-slate-400">
                <p className="mb-1">Sur Safari, appuyez sur :</p>
                <p className="text-white font-medium">
                  Partager → "Sur l'écran d'accueil"
                </p>
              </div>
            ) : (
              // Bouton installation Android/Desktop
              <button
                onClick={handleInstall}
                className="w-full bg-[#00ADEF] hover:bg-[#0095d0] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                <Download size={18} />
                Installer maintenant
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
