'use client';

import React, { useState } from 'react';
import { Factory, Truck, Snowflake, Info, MapPin, Phone, Clock, Mail, ChevronRight, CheckCircle2 } from 'lucide-react';
import { SERVICES } from '@/constants';

const iconMap: Record<string, React.ElementType> = {
  Factory,
  Truck,
  Snowflake,
  Info,
};

const Services = () => {
  const [selectedService, setSelectedService] = useState<string | null>(SERVICES[0].title);

  const getServiceDetails = (title: string) => {
    switch (title) {
      case 'Livraison Rapide':
        return (
          <div className="grid lg:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-[#00ADEF] px-4 py-1.5 rounded-full text-sm font-bold">
                <Truck className="w-4 h-4" />
                <span>Zone de Fraîcheur Active</span>
              </div>
              <h3 className="text-3xl font-black text-[#1E3A8A]">Livraison Express à Lomé</h3>
              <p className="text-slate-600 leading-relaxed">
                Notre service de livraison rapide couvre toute la zone urbaine de Lomé. Nous disposons d'une flotte de camions réfrigérés pour garantir que vos glaçons arrivent intacts, peu importe la température extérieure.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Clock, label: 'Temps moyen', value: '30-45 min' },
                  { icon: MapPin, label: 'Zone', value: 'Lomé & Périphérie' },
                  { icon: Phone, label: 'Urgence', value: '+228 79 74 75 75' },
                  { icon: CheckCircle2, label: 'Suivi', value: 'Temps Réel' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#00ADEF]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">{item.label}</p>
                      <p className="font-bold text-[#1E3A8A]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-[#1E3A8A] rounded-3xl text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="font-bold text-xl mb-2">Besoin d'une livraison immédiate ?</h4>
                  <p className="text-blue-100 text-sm mb-4">Nos livreurs sont déjà en route dans votre quartier.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href="tel:+22879747575" className="inline-flex items-center gap-2 bg-[#00ADEF] hover:bg-white hover:text-[#00ADEF] px-6 py-3 rounded-xl font-bold transition-all transform active:scale-95">
                      <Phone className="w-4 h-4" />
                      Appeler l'assistance
                    </a>
                  </div>
                </div>
                <Truck className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 transform -rotate-12 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div className="relative h-[450px] bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl group border-8 border-white">
              {/* Carte Réelle */}
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                title="PRO-GLAÇONS Location"
                src="https://maps.google.com/maps?width=100%25&height=600&hl=fr&q=Hédzranawoé,%20Lomé,%20Togo+(PRO-GLAÇONS)&t=&z=15&ie=UTF8&iwloc=B&output=embed"
                className="filter contrast-[1.1]"
              ></iframe>
              
              {/* Badge Overlay */}
              <div className="absolute top-6 left-6 z-10 pointer-events-none transition-transform group-hover:scale-105 duration-500">
                <div className="bg-white p-4 rounded-2xl shadow-2xl border border-blue-50 flex items-center gap-4">
                  <div className="bg-[#00ADEF] p-3 rounded-xl text-white shadow-lg shadow-blue-200">
                    <Snowflake size={24} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="font-black text-[#1E3A8A] leading-none mb-1">PRO-GLAÇONS HQ</h4>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-[#00ADEF]">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      OUVERT MAINTENANT
                    </div>
                  </div>
                </div>
              </div>

              {/* Info bulle Overlay (Bottom) */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <MapPin className="text-[#00ADEF] w-5 h-5" />
                    <div>
                      <h5 className="font-extrabold text-[#1E3A8A] text-sm">Zone de Fraîcheur Active</h5>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hédzranawoé, Lomé</p>
                    </div>
                  </div>
                  <a href="https://maps.google.com" target="_blank" className="bg-[#1E3A8A] text-white p-2.5 rounded-xl hover:bg-[#00ADEF] transition-colors shadow-lg">
                     <ChevronRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Vente au détail':
        return (
          <div className="grid lg:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="order-2 lg:order-1 relative rounded-[3rem] overflow-hidden shadow-xl aspect-square bg-slate-50">
                <img src="/images/IMG_0555.jpg" className="w-full h-full object-contain" alt="Vente au détail" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/20 to-transparent flex items-end p-10">
                   <div className="text-white">
                      <p className="text-blue-200 font-bold mb-2">Qualité Premium</p>
                      <h4 className="text-2xl font-black">Nos Glaçons en Sac</h4>
                   </div>
                </div>
             </div>
             <div className="order-1 lg:order-2 space-y-6">
                <h3 className="text-3xl font-black text-[#1E3A8A]">Vente au Détail & Grossiste</h3>
                <p className="text-slate-600 leading-relaxed">
                  Que vous soyez un particulier cherchant un sac pour un pique-nique ou un restaurateur ayant besoin d'un approvisionnement constant, nous avons la solution adaptée.
                </p>
                <div className="space-y-3">
                   {[
                     "Sacs de 2kg, 5kg et 10kg disponibles",
                     "Pureté cristalline garantie",
                     "Conservation longue durée",
                     "Tarifs dégressifs pour les pros"
                   ].map((text, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#00ADEF]" />
                        <span className="font-medium text-slate-700">{text}</span>
                     </div>
                   ))}
                </div>
                <button className="bg-[#1E3A8A] text-white px-8 py-4 rounded-full font-bold hover:bg-[#00ADEF] transition-all">
                  Voir nos formats
                </button>
             </div>
          </div>
        );
      default:
        return (
          <div className="py-20 text-center bg-slate-50 rounded-[3rem] animate-in fade-in duration-500">
            <Info className="w-16 h-16 text-[#00ADEF] mx-auto mb-4 opacity-20" />
            <h3 className="text-2xl font-bold text-[#1E3A8A]">Détails du service</h3>
            <p className="text-slate-500 mt-2">Sélectionnez un service pour voir les détails.</p>
          </div>
        );
    }
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <p className="text-[#00ADEF] font-bold text-sm uppercase tracking-widest mb-4">
              Service Premium
            </p>
            <h2 className="text-4xl lg:text-6xl font-black text-[#1E3A8A] leading-[1.1]">
              L'Excellence au service de votre <span className="text-[#00ADEF]">Fraîcheur</span>
            </h2>
          </div>
          <p className="text-slate-500 max-w-xs text-sm leading-relaxed border-l-2 border-blue-100 pl-4">
            Une logistique de pointe pour assurer une disponibilité 24/7 partout dans la capitale.
          </p>
        </div>

        {/* Tabs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {SERVICES.map((service, index) => {
            const IconComponent = iconMap[service.icon] || Snowflake;
            const isSelected = selectedService === service.title;
            
            return (
              <button 
                key={index}
                onClick={() => setSelectedService(service.title)}
                className={`group text-left p-8 rounded-[2.5rem] transition-all duration-500 transform ${
                  isSelected 
                  ? 'bg-[#1E3A8A] text-white shadow-2xl scale-[1.02] -translate-y-2' 
                  : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                  isSelected ? 'bg-white/20' : 'bg-[#00ADEF]/10'
                }`}>
                  <IconComponent className={`w-7 h-7 transition-colors ${
                    isSelected ? 'text-white' : 'text-[#00ADEF]'
                  }`} />
                </div>
                <h3 className="text-lg font-bold mb-3">
                  {service.title}
                </h3>
                <p className={`text-sm leading-relaxed transition-colors ${
                  isSelected ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {service.description.substring(0, 80)}...
                </p>
                <div className={`mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                   isSelected ? 'text-white opacity-100' : 'text-[#00ADEF] opacity-0 group-hover:opacity-100'
                }`}>
                   En savoir plus
                   <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Detail Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#00ADEF]/5 blur-3xl rounded-full"></div>
          <div className="relative bg-white border border-slate-100 rounded-[3.5rem] p-8 lg:p-16 shadow-sm overflow-hidden min-h-[500px]">
             {getServiceDetails(selectedService || '')}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
