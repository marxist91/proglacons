'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, Snowflake, ArrowLeft, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const { login, register, addNotification } = useApp();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (!isLogin) {
      if (!fullName) {
        newErrors.fullName = 'Le nom est requis';
      }
      
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
        addNotification('Bienvenue !', 'Connexion réussie', 'success');
        router.push(redirect);
      } else {
        await register({
          email,
          password,
          fullName,
          phone: phone || undefined,
          neighborhood: neighborhood || undefined,
        });
        addNotification('Inscription réussie', 'Vous pouvez maintenant vous connecter', 'success');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      addNotification('Erreur', error.message || 'Une erreur est survenue', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const neighborhoods = [
    'Adidogomé', 'Agoè', 'Bè', 'Djidjolé', 'Hédzranawoé', 
    'Kodjoviakopé', 'Lomé Centre', 'Nyékonakpoè', 'Tokoin', 'Totsi'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl"></div>
        {[...Array(6)].map((_, i) => (
          <Snowflake
            key={i}
            className="absolute text-cyan-300/40 animate-fall"
            style={{
              left: `${10 + i * 15}%`,
              top: `${-10 - i * 5}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + i}s`,
            }}
            size={20 + i * 4}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md">
        {/* Back button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-cyan-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Retour à l'accueil
        </Link>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-cyan-500/10 border border-white/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-sky-500 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Snowflake className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isLogin ? 'Connexion' : 'Inscription'}
            </h1>
            <p className="text-cyan-100 mt-1">
              {isLogin ? 'Accédez à votre compte Pro Glaçons' : 'Créez votre compte Pro Glaçons'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Full Name (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className={`w-full pl-10 pr-4 py-3 border ${errors.fullName ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all`}
                  />
                </div>
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-3 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Phone (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+228 90 12 34 56"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Neighborhood (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quartier
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="">Sélectionnez votre quartier</option>
                    {neighborhoods.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-sky-600 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {isLogin ? 'Connexion...' : 'Inscription...'}
                </>
              ) : (
                isLogin ? 'Se connecter' : 'S\'inscrire'
              )}
            </button>

            {/* Toggle login/register */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-gray-600">
                {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="ml-2 text-cyan-600 font-semibold hover:text-cyan-700 transition-colors"
                >
                  {isLogin ? 'S\'inscrire' : 'Se connecter'}
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          En continuant, vous acceptez nos{' '}
          <a href="#" className="text-cyan-600 hover:underline">conditions d'utilisation</a>
        </p>
      </div>
    </div>
  );
}
