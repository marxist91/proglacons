'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Snowflake, Lock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1E3A8A] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Snowflake className="text-[#00ADEF] w-8 h-8" />
              <span className="text-2xl font-black">PRO-GLACONS</span>
            </div>
            <p className="text-blue-100/70 text-sm leading-relaxed">
              Le leader de la glace alimentaire et industrielle a Lome. Securite, rapidite et disponibilite garantie pour tous vos evenements.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00ADEF] transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00ADEF] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00ADEF] transition-colors"><Twitter className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Navigation</h4>
            <ul className="space-y-4 text-sm text-blue-100/70">
              <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Nos Services</Link></li>
              <li><Link href="/catalog" className="hover:text-white transition-colors">Catalogue Produits</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Contactez-nous</h4>
            <ul className="space-y-4 text-sm text-blue-100/70">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#00ADEF] shrink-0" />
                <span>+228 79 74 75 75</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#00ADEF] shrink-0" />
                <span>Contact@proglacons.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#00ADEF] shrink-0" />
                <span>Hedzranawoe, Lome, Togo</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Newsletter</h4>
            <p className="text-sm text-blue-100/70 mb-4">Inscrivez-vous pour recevoir nos offres.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Votre email" 
                className="bg-white/10 border-none rounded-xl px-4 py-3 text-sm flex-1 focus:ring-2 focus:ring-[#00ADEF] outline-none"
              />
              <button className="bg-[#00ADEF] p-3 rounded-xl font-bold">OK</button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-blue-100/40 text-xs">
          <p>2026 PRO-GLACONS SARL. Tous droits reserves.</p>
          <Link 
            href="/admin"
            className="flex items-center gap-2 hover:text-[#00ADEF] transition-colors font-bold uppercase tracking-widest"
          >
            <Lock className="w-3 h-3" /> Espace Administration
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
