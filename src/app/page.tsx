'use client';

import Hero from '@/components/Hero';
import Services from '@/components/Services';
import ProductCard from '@/components/ProductCard';
import { useApp } from '@/lib/context';
import { Loader2, ArrowRight, ShieldCheck, Clock, Zap, Star } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { products, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl animate-pulse"></div>
          <Loader2 className="w-16 h-16 text-[#00ADEF] animate-spin relative z-10" />
        </div>
        <p className="mt-8 text-xl font-black text-[#1E3A8A] tracking-tighter">PRESERVATION DU FROID...</p>
      </div>
    );
  }

  return (
    <main className="overflow-hidden">
      <Hero />
      
      {/* Stats Banner / Trust Bar */}
      <section className="py-12 bg-white border-b border-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, title: "100% Sanitaire", desc: "Eau osmosée filtrée" },
              { icon: Clock, title: "Livraison 45min", desc: "Moyenne constatée" },
              { icon: Zap, title: "Stock Garanti", desc: "Disponibilité 24/7" },
              { icon: Star, title: "Top Qualité", desc: "Leader au Togo" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] group-hover:bg-[#1E3A8A] group-hover:text-white transition-all duration-500">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-[#1E3A8A] text-sm uppercase">{stat.title}</h4>
                  <p className="text-xs text-slate-400 font-bold">{stat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-slate-50/50 relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <p className="text-[#00ADEF] font-black text-sm uppercase tracking-[0.3em] mb-4">La Boutique</p>
              <h2 className="text-4xl lg:text-6xl font-black text-[#1E3A8A] tracking-tight">Nos Meilleures <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ADEF] to-[#1E3A8A]">Ventes</span></h2>
            </div>
            <Link 
              href="/catalog" 
              className="inline-flex items-center gap-2 text-[#00ADEF] font-black group hover:translate-x-2 transition-transform"
            >
              Voir tout le catalogue
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.slice(0, 3).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {/* CTA Banner inside Home */}
          <div className="mt-24 relative rounded-[3rem] overflow-hidden bg-[#1E3A8A] p-12 lg:p-20 text-white group">
             <div className="absolute top-0 right-0 w-1/2 h-full bg-[#00ADEF]/10 -skew-x-12 translate-x-20 group-hover:translate-x-10 transition-transform duration-1000"></div>
             <div className="relative z-10 max-w-2xl">
                <h3 className="text-4xl lg:text-6xl font-black mb-8 leading-[1.1]">Organisez votre événement sans stress.</h3>
                <p className="text-xl text-blue-100 mb-10 leading-relaxed font-medium">
                  Nous fournissons les plus grands restaurants et hôtels de Lomé. Pourquoi pas vous ? Volume illimité disponible sur demande.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/catalog" className="bg-[#00ADEF] hover:bg-white hover:text-[#00ADEF] text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl">
                    Commander en ligne
                  </Link>
                  <a href="tel:+22879747575" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all">
                    Devenir Partenaire
                  </a>
                </div>
             </div>
             <img src="/images/IMG_0557.jpg" className="absolute right-0 top-0 h-full w-1/3 object-cover opacity-30 grayscale group-hover:grayscale-0 transition-all duration-1000 hidden lg:block" alt="Pro" />
          </div>
        </div>
      </section>

      <Services />

      {/* Newsletter / Final CTA Hook */}
      <section className="py-24 bg-white">
         <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
               <Zap className="w-10 h-10 text-[#00ADEF]" />
            </div>
            <h2 className="text-3xl lg:text-5xl font-black text-[#1E3A8A] mb-6">Prêt à rafraîchir vos moments ?</h2>
            <p className="text-slate-500 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Inscrivez-vous pour recevoir nos offres exclusives et nos conseils pour vos soirées.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 p-2 bg-slate-50 rounded-3xl border border-slate-100 max-w-xl mx-auto">
               <input 
                type="email" 
                placeholder="Votre adresse email" 
                className="flex-1 bg-transparent px-6 py-4 rounded-2xl focus:outline-none font-medium"
               />
               <button className="bg-[#1E3A8A] text-white px-8 py-4 rounded-2xl font-black hover:bg-[#00ADEF] shadow-lg transition-all">
                S'abonner
               </button>
            </form>
         </div>
      </section>
    </main>
  );
}
