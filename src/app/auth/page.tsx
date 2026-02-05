import React, { Suspense } from 'react';

export const dynamic = 'force-dynamic';

import AuthForm from '@/components/AuthForm';

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement…</div>}>
      <AuthForm />
    </Suspense>
  );
}
