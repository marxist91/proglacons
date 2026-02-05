'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, ShoppingCart, MapPin, Phone, Snowflake, Sparkles, Star, Gift } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue chez Pro Glaçons ! ❄️',
    description: 'Découvrez comment commander vos glaçons premium en quelques clics. Ce tour rapide vous guidera.',
    icon: <Snowflake className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'catalog',
    title: 'Notre catalogue',
    description: 'Parcourez notre sélection de glaçons : cubiques, tubes, pilés... Cliquez sur un produit pour voir les détails.',
    icon: <Sparkles className="w-8 h-8" />,
    targetSelector: '[data-tour="catalog"]',
    position: 'bottom',
  },
  {
    id: 'cart',
    title: 'Votre panier',
    description: 'Ajoutez des produits et retrouvez-les dans votre panier. Glissez pour supprimer ou ajouter aux favoris !',
    icon: <ShoppingCart className="w-8 h-8" />,
    targetSelector: '[data-tour="cart"]',
    position: 'left',
  },
  {
    id: 'delivery',
    title: 'Livraison express',
    description: 'Nous livrons dans tout Ouagadougou en 30 minutes à 1 heure. Choisissez votre quartier lors de la commande.',
    icon: <MapPin className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'contact',
    title: 'Besoin d\'aide ?',
    description: 'Contactez-nous via WhatsApp ou utilisez notre chatbot IA en bas à droite pour des réponses instantanées.',
    icon: <Phone className="w-8 h-8" />,
    targetSelector: '[data-tour="whatsapp"]',
    position: 'top',
  },
  {
    id: 'rewards',
    title: 'Programme de fidélité',
    description: 'Gagnez des points à chaque commande et parrainez vos amis pour des réductions exclusives !',
    icon: <Gift className="w-8 h-8" />,
    position: 'center',
  },
];

const STORAGE_KEY = 'proglacons_onboarding_complete';

interface OnboardingTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, forceShow = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  // Check if onboarding was completed
  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      return;
    }

    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Delay to allow page to load
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  // Find and highlight target element
  useEffect(() => {
    if (!isOpen || !step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const target = document.querySelector(step.targetSelector!);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget);

    return () => {
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget);
    };
  }, [isOpen, step, currentStep]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    }
  }, [isLastStep]);

  const handlePrev = useCallback(() => {
    if (!isFirstStep) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  }, [isFirstStep]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Calculer la position du tooltip
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (step.position) {
      case 'top':
        return {
          bottom: window.innerHeight - targetRect.top + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case 'bottom':
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          right: window.innerWidth - targetRect.left + padding,
        };
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + padding,
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      {/* Overlay sombre */}
      <div 
        className="absolute inset-0 bg-black/70 transition-opacity duration-300"
        onClick={handleSkip}
      />

      {/* Spotlight sur l'élément cible */}
      {targetRect && (
        <div
          className="absolute bg-transparent border-4 border-[#00ADEF] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] transition-all duration-300 pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`absolute w-80 bg-[var(--card-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] overflow-hidden transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={getTooltipStyle()}
      >
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-[#00ADEF] to-[#1E3A8A] p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              {step.icon}
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Fermer le tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 id="onboarding-title" className="text-lg font-bold">{step.title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[var(--foreground-muted)] text-sm leading-relaxed mb-6">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-[#00ADEF]'
                    : idx < currentStep
                    ? 'bg-[#00ADEF]/50'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
                aria-label={`Étape ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isFirstStep
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-[var(--foreground)] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2.5 bg-[#00ADEF] text-white font-semibold rounded-xl hover:bg-[#0095d0] transition-all transform hover:scale-105 active:scale-95"
            >
              {isLastStep ? (
                <>
                  <Star className="w-4 h-4" />
                  Commencer
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Skip button en bas */}
      <button
        onClick={handleSkip}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white/70 hover:text-white text-sm underline transition-colors"
      >
        Passer le tour guidé
      </button>
    </div>
  );
};

// Hook pour relancer le tour manuellement
export const useOnboarding = () => {
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  const isOnboardingComplete = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }, []);

  return { resetOnboarding, isOnboardingComplete };
};

export default OnboardingTour;
