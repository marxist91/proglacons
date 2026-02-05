'use client';

import React from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import Services from '@/components/Services';
import { Phone, ChevronRight, Clock, ShieldCheck, Award, Zap, Snowflake } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div className="pt-32 pb-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Services' }]} />
        
        <div className="text-center mt-12 mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#00ADEF] px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4">
             <Zap className="w-4 h-4 fill-current" />
             Solutions de Froid à Lomé
          </div>
          <h1 className="text-5xl lg:text-7xl font-[900] text-[#1E3A8A] mb-8 leading-tight tracking-tighter">
            L'Excellence du <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ADEF] to-[#1E3A8A]">SERVICE PRO</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            PRO-GLAÇONS n'est pas qu'un fournisseur de glace. Nous sommes votre partenaire logistique pour tous vos besoins de refroidissement.
          </p>
        </div>
      </div>

      {/* Utilisation de notre composant Premium Services qui contient déjà toute l'interactivité */}
      <Services />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        {/* Avantages additionnels pour la page dédiée */}
        <div className="grid lg:grid-cols-3 gap-12 mb-20">
           {[
             { 
               icon: Clock, 
               title: "Chaîne du Froid", 
               desc: "Nos camions sont équipés de sondes de température pour garantir une glace qui ne fond pas avant l'arrivée." 
             },
             { 
               icon: ShieldCheck, 
               title: "Pureté Maximale", 
               desc: "Eau passée par 5 étapes de filtration dont l'osmose inverse et les UV pour une transparence cristalline." 
             },
             { 
               icon: Award, 
               title: "Contrats Pro", 
               desc: "Restaurants, Hôtels et bars bénéficient de tarifs préférentiels et d'un approvisionnement prioritaire." 
             }
           ].map((item, i) => (
             <div key={i} className="relative group p-8 rounded-[2rem] bg-slate-50 border border-transparent hover:border-blue-100 hover:bg-white transition-all duration-500 shadow-sm">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-slate-200/50 group-hover:scale-110 transition-transform">
                   <item.icon className="w-7 h-7 text-[#00ADEF]" />
                </div>
                <h4 className="text-xl font-black text-[#1E3A8A] mb-3">{item.title}</h4>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">{item.desc}</p>
             </div>
           ))}
        </div>

        {/* Final CTA Hooks */}
        <div className="relative rounded-[3.5rem] bg-gradient-to-br from-[#1E3A8A] to-[#011444] p-10 lg:p-20 overflow-hidden group">
           {/* Decor */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ADEF]/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
           
           <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                 <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">Prêt à passer au <br/><span className="text-[#00ADEF]">Niveau Supérieur ?</span></h2>
                 <p className="text-blue-100/90 text-lg mb-8 max-w-xl font-medium">
                   Rejoignez nos 500+ clients professionnels qui nous font confiance pour leur approvisionnement quotidien.
                 </p>
                 <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                    <a href="tel:+22879747575" className="bg-[#00ADEF] text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white hover:text-[#00ADEF] transition-all shadow-xl active:scale-95">
                       Parler à un agent
                    </a>
                    <Link href="/catalog" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition-all active:scale-95">
                       Explorer les produits
                    </Link>
                 </div>
              </div>
              <div className="w-64 h-64 lg:w-80 lg:h-80 relative">
                 <div className="absolute inset-0 bg-[#00ADEF]/20 rounded-full animate-pulse"></div>
                 <div className="absolute inset-4 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center">
                    <Snowflake className="w-32 h-32 text-white/20 animate-spin-slow" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
