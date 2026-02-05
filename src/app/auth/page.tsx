import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const AuthForm = dynamic(() => import('@/components/AuthForm'), { ssr: false });

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement…</div>}>
      <AuthForm />
    </Suspense>
  );
}
