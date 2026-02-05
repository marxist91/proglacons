'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Check, X, Loader2 } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

interface PushNotificationsProps {
  compact?: boolean;
}

const PushNotifications: React.FC<PushNotificationsProps> = ({ compact = false }) => {
  const { haptics } = useHaptics();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Vérifier si les notifications sont supportées
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Vérifier si déjà inscrit
      const subscribed = localStorage.getItem('proglacons_push_subscribed') === 'true';
      setIsSubscribed(subscribed && Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return;
    
    setIsLoading(true);
    haptics.buttonPress();

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Enregistrer le Service Worker si pas déjà fait
        const registration = await navigator.serviceWorker.ready;
        
        // Simuler l'inscription aux push (dans un vrai cas, on enverrait au serveur)
        localStorage.setItem('proglacons_push_subscribed', 'true');
        setIsSubscribed(true);
        haptics.success();

        // Envoyer une notification de test
        new Notification('🧊 PRO-GLAÇONS', {
          body: 'Notifications activées ! Vous serez alerté de vos commandes.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'welcome',
        });
      } else {
        haptics.error();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = () => {
    haptics.buttonPress();
    localStorage.removeItem('proglacons_push_subscribed');
    setIsSubscribed(false);
  };

  // Fonction pour envoyer une notification (à utiliser dans d'autres composants)
  const sendNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (permission !== 'granted' || !isSubscribed) return false;

    try {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  };

  // Exposer la fonction pour d'autres composants
  if (typeof window !== 'undefined') {
    (window as any).sendPushNotification = sendNotification;
  }

  if (!isSupported) {
    if (compact) return null;
    
    return (
      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-center">
        <BellOff size={24} className="mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-500">Notifications non supportées sur ce navigateur</p>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={isSubscribed ? unsubscribe : requestPermission}
        disabled={isLoading || permission === 'denied'}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
          isSubscribed
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20'
            : permission === 'denied'
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-[#00ADEF]/10 text-[#00ADEF] hover:bg-[#00ADEF]/20'
        }`}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isSubscribed ? (
          <Check size={16} />
        ) : (
          <Bell size={16} />
        )}
        <span className="text-sm font-medium">
          {isSubscribed ? 'Activées' : permission === 'denied' ? 'Bloquées' : 'Activer'}
        </span>
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
          isSubscribed
            ? 'bg-green-100 dark:bg-green-900/20'
            : 'bg-[#00ADEF]/10'
        }`}>
          {isSubscribed ? (
            <Bell size={28} className="text-green-600" />
          ) : (
            <Bell size={28} className="text-[#00ADEF]" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-slate-700 dark:text-white mb-1">Notifications push</h3>
          <p className="text-sm text-slate-500 mb-4">
            {isSubscribed
              ? 'Vous recevrez des alertes pour vos commandes et promotions.'
              : permission === 'denied'
              ? 'Les notifications sont bloquées. Modifiez les paramètres de votre navigateur.'
              : 'Activez les notifications pour suivre vos commandes en temps réel.'}
          </p>

          {permission !== 'denied' && (
            <button
              onClick={isSubscribed ? unsubscribe : requestPermission}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                isSubscribed
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600'
                  : 'bg-[#1E3A8A] text-white hover:bg-[#00ADEF]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Chargement...
                </>
              ) : isSubscribed ? (
                <>
                  <BellOff size={18} />
                  Désactiver
                </>
              ) : (
                <>
                  <Bell size={18} />
                  Activer les notifications
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Aperçu des notifications */}
      {isSubscribed && (
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Vous recevrez :</p>
          <div className="space-y-2">
            {[
              '📦 Confirmation de commande',
              '🚚 Livreur en route',
              '✅ Livraison effectuée',
              '🎉 Promotions exclusives',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Check size={14} className="text-green-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PushNotifications;

// Hook pour utiliser les notifications dans d'autres composants
export const usePushNotification = () => {
  const send = (title: string, body: string, options?: NotificationOptions) => {
    if (typeof window !== 'undefined' && (window as any).sendPushNotification) {
      return (window as any).sendPushNotification(title, body, options);
    }
    return false;
  };

  return { send };
};
