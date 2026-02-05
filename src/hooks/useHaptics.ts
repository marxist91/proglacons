'use client';

/**
 * Hook pour le feedback haptique (vibrations) sur mobile
 * Améliore l'expérience utilisateur native
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Patterns de vibration pour différentes actions
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10, 50, 30],
  warning: [30, 30, 30],
  error: [50, 100, 50],
  selection: 5,
};

export function useHaptics() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const vibrate = (type: HapticType = 'light') => {
    if (!isSupported) return false;
    
    try {
      const pattern = HAPTIC_PATTERNS[type];
      return navigator.vibrate(pattern);
    } catch (e) {
      return false;
    }
  };

  // Vibrations prédéfinies pour les actions courantes
  const haptics = {
    // Ajout au panier - succès léger
    addToCart: () => vibrate('success'),
    
    // Suppression du panier - warning
    removeFromCart: () => vibrate('warning'),
    
    // Favoris toggle
    toggleFavorite: () => vibrate('medium'),
    
    // Bouton pressé
    buttonPress: () => vibrate('light'),
    
    // Sélection dans une liste
    selection: () => vibrate('selection'),
    
    // Erreur
    error: () => vibrate('error'),
    
    // Succès (commande validée)
    success: () => vibrate('success'),
    
    // Swipe action
    swipe: () => vibrate('medium'),
    
    // Pull to refresh trigger
    pullRefresh: () => vibrate('heavy'),
  };

  return {
    isSupported,
    vibrate,
    haptics,
  };
}

export default useHaptics;
