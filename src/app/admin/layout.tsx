import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Pro Glaçons',
  description: 'Panneau d\'administration Pro Glaçons',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout spécifique pour l'admin - sans Navbar/Footer de la boutique
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {children}
    </div>
  );
}
