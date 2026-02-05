'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Snowflake, ChevronDown } from 'lucide-react';
import { ChatMessage, FAQItem } from '@/types';
import { useHaptics } from '@/hooks/useHaptics';

// Base de connaissances FAQ
const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'Quels sont vos horaires de livraison ?',
    answer: 'Nous livrons de 8h à 20h, 7j/7. Pour les commandes urgentes, contactez-nous sur WhatsApp au 79 74 75 75.',
    category: 'Livraison',
    keywords: ['horaire', 'livraison', 'heure', 'quand', 'délai'],
  },
  {
    id: '2',
    question: 'Quels quartiers livrez-vous ?',
    answer: 'Nous livrons dans tout Lomé : Hédzranawoé, Agoè, Adidogomé, Bè, Grand Marché, Avepozo, et bien plus. Les frais varient de 500 à 2000 FCFA selon la zone.',
    category: 'Livraison',
    keywords: ['quartier', 'zone', 'livraison', 'où', 'lomé', 'lieu'],
  },
  {
    id: '3',
    question: 'Comment puis-je payer ?',
    answer: 'Nous acceptons le paiement en espèces à la livraison et Mobile Money (Flooz/TMoney). Préparez le montant exact pour faciliter la transaction.',
    category: 'Paiement',
    keywords: ['paiement', 'payer', 'argent', 'cash', 'mobile money', 'flooz', 'tmoney'],
  },
  {
    id: '4',
    question: 'Quelle est la durée de conservation des glaçons ?',
    answer: 'Nos glaçons isothermes (Cubes/Grains de Luxe) conservent leur fraîcheur 4-6h dans un sac isotherme. Les glaçons classiques durent 2-3h selon la température ambiante.',
    category: 'Produits',
    keywords: ['conservation', 'durée', 'fondre', 'combien de temps', 'garder'],
  },
  {
    id: '5',
    question: 'Puis-je commander en gros pour un événement ?',
    answer: 'Absolument ! Nous proposons des tarifs dégressifs pour les grandes quantités (mariages, fêtes, entreprises). Contactez-nous pour un devis personnalisé.',
    category: 'Commandes',
    keywords: ['gros', 'événement', 'mariage', 'fête', 'quantité', 'entreprise', 'devis'],
  },
  {
    id: '6',
    question: 'Comment suivre ma commande ?',
    answer: 'Allez dans "Suivi Commande" depuis le menu. Entrez votre numéro de téléphone pour voir le statut en temps réel et la position de votre livreur.',
    category: 'Commandes',
    keywords: ['suivre', 'commande', 'suivi', 'où', 'livreur', 'statut'],
  },
  {
    id: '7',
    question: 'Qu\'est-ce que la Carbo Glace ?',
    answer: 'La Carbo Glace (glace carbonique) est idéale pour les effets spéciaux, la conservation alimentaire industrielle et le transport de produits sensibles. Attention : ne pas toucher à main nue !',
    category: 'Produits',
    keywords: ['carbo', 'glace', 'carbonique', 'sèche', 'fumée'],
  },
  {
    id: '8',
    question: 'Avez-vous un programme de fidélité ?',
    answer: 'Oui ! Gagnez des points à chaque achat : 10 points par tranche de 1000 FCFA. Échangez-les contre des réductions. Devenez Gold ou Platinum pour des bonus exclusifs !',
    category: 'Fidélité',
    keywords: ['fidélité', 'points', 'récompense', 'bonus', 'réduction'],
  },
];

// Réponses par défaut
const DEFAULT_RESPONSES = [
  "Je suis là pour vous aider ! Posez-moi une question sur nos produits, la livraison ou le paiement. 🧊",
  "Je n'ai pas trouvé de réponse exacte, mais vous pouvez nous contacter sur WhatsApp au 79 74 75 75 pour plus d'aide.",
  "Bonne question ! Notre équipe peut mieux vous répondre. Appelez-nous ou envoyez un message WhatsApp.",
];

// Suggestions rapides
const QUICK_SUGGESTIONS = [
  'Horaires de livraison',
  'Modes de paiement',
  'Suivi de commande',
  'Programme fidélité',
];

const ChatbotAI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const { haptics } = useHaptics();

  // Fonction pure pour obtenir un ID unique
  const getNextId = () => {
    messageIdRef.current += 1;
    return messageIdRef.current.toString();
  };

  // Message de bienvenue
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: getNextId(),
          role: 'assistant',
          content: 'Bonjour ! 👋 Je suis l\'assistant PRO-GLAÇONS. Comment puis-je vous aider aujourd\'hui ?',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  // Scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Trouver la meilleure réponse
  const findBestAnswer = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    let bestMatch: FAQItem | null = null;
    let maxScore = 0;

    for (const faq of FAQ_DATA) {
      let score = 0;
      
      // Vérifier les mots-clés
      for (const keyword of faq.keywords) {
        if (lowerQuery.includes(keyword)) {
          score += 2;
        }
      }
      
      // Vérifier la question
      const questionWords = faq.question.toLowerCase().split(' ');
      for (const word of questionWords) {
        if (word.length > 3 && lowerQuery.includes(word)) {
          score += 1;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = faq;
      }
    }

    if (bestMatch && maxScore >= 2) {
      return bestMatch.answer;
    }

    // Réponses contextuelles basiques
    if (lowerQuery.includes('bonjour') || lowerQuery.includes('salut') || lowerQuery.includes('hello')) {
      return 'Bonjour ! 😊 Comment puis-je vous aider avec votre commande de glaçons ?';
    }
    if (lowerQuery.includes('merci')) {
      return 'Je vous en prie ! N\'hésitez pas si vous avez d\'autres questions. 🧊';
    }
    if (lowerQuery.includes('prix') || lowerQuery.includes('coût') || lowerQuery.includes('tarif')) {
      return 'Nos prix varient selon les produits : Glaçons classiques à 3 300 FCFA, Isothermes à 3 500 FCFA, Ice Cup à 500 FCFA. Consultez notre catalogue pour plus de détails !';
    }

    // Retourner une réponse par défaut fixe (pas de Math.random pendant le render)
    return DEFAULT_RESPONSES[1];
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    haptics.buttonPress();
    
    // Message utilisateur
    const userMessage: ChatMessage = {
      id: getNextId(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simuler un délai de réponse
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Réponse de l'assistant
    const answer = findBestAnswer(messageText);
    const assistantMessage: ChatMessage = {
      id: getNextId(),
      role: 'assistant',
      content: answer,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
    haptics.success();
  };

  const handleQuickSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          haptics.buttonPress();
        }}
        className={`fixed bottom-24 md:bottom-8 right-4 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 ${
          isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-br from-[#00ADEF] to-[#1E3A8A]'
        }`}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Bot size={24} className="text-white" />
        )}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="fixed bottom-40 md:bottom-24 right-4 z-50 w-[90vw] max-w-[380px] h-[70vh] max-h-[500px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 animate-slide-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#00ADEF] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Snowflake size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white">Assistant PRO-GLAÇONS</h3>
              <p className="text-xs text-white/70">Toujours là pour vous aider</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronDown size={20} className="text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-touch">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-[#1E3A8A] text-white rounded-br-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="px-3 py-1.5 bg-[#00ADEF]/10 text-[#00ADEF] text-xs font-medium rounded-full hover:bg-[#00ADEF]/20 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tapez votre message..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-[#00ADEF] text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-12 h-12 rounded-2xl bg-[#1E3A8A] hover:bg-[#00ADEF] text-white flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotAI;
