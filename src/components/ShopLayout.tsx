'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import Notifications from '@/components/Notifications';
import BottomNav from '@/components/BottomNav';
import InstallPWA from '@/components/InstallPWA';
import PullToRefresh from '@/components/PullToRefresh';
import BackGestureIndicator from '@/components/BackGestureIndicator';
import ChatbotAI from '@/components/ChatbotAI';
import OnboardingTour from '@/components/OnboardingTour';
import { SkipToContent, useGlobalA11yShortcuts } from '@/components/Accessibility';
import { ResourceHints } from '@/components/Performance';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith('/admin');
  const isDriver = pathname?.startsWith('/driver');
  const isProductPage = pathname?.startsWith('/produit');
  const isHome = pathname === '/';

  // Global accessibility shortcuts (Alt+1=Home, Alt+2=Catalog, etc.)
  useGlobalA11yShortcuts();

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.refresh();
  }, [router]);

  // Si on est sur /admin ou /driver, on n'affiche pas le layout de la boutique
  if (isAdmin || isDriver) {
    return <>{children}</>;
  }

  // Layout simplifié pour la page produit (elle a son propre header)
  if (isProductPage) {
    return (
      <div className="bg-[var(--background)] text-[var(--foreground)] min-h-screen transition-colors duration-300">
        <main id="main-content" role="main" aria-label="Contenu principal">
          {children}
        </main>
        <Cart />
        <WhatsAppWidget />
        <Notifications />
        <BackGestureIndicator enabled={true} />
      </div>
    );
  }

  // Layout normal de la boutique
  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] min-h-screen transition-colors duration-300">
      {/* Accessibility: Skip to content link */}
      <SkipToContent targetId="main-content" />
      
      {/* Performance: Resource hints */}
      <ResourceHints
        preconnect={['https://fonts.googleapis.com', 'https://fonts.gstatic.com']}
        dnsPrefetch={['https://api.proglacons.com']}
      />
      
      <Navbar />
      <PullToRefresh onRefresh={handleRefresh}>
        <main id="main-content" className="pb-24 md:pb-0" role="main" aria-label="Contenu principal">
          {children}
        </main>
      </PullToRefresh>
      <Footer />
      <Cart />
      <WhatsAppWidget />
      <Notifications />
      <BottomNav />
      <InstallPWA />
      {/* Chatbot IA */}
      <ChatbotAI />
      {/* Navigation gestuelle - désactivée sur la page d'accueil */}
      <BackGestureIndicator enabled={!isHome} />
      {/* Onboarding tour pour nouveaux utilisateurs */}
      {isHome && <OnboardingTour />}
    </div>
  );
}
