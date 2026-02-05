'use client';

import React, { useState } from 'react';
import { Star, ThumbsUp, User, CheckCircle, MessageSquare } from 'lucide-react';
import { ProductReview, ProductRating } from '@/types';
import { useApp } from '@/lib/context';
import { useHaptics } from '@/hooks/useHaptics';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

// Données de démonstration
const DEMO_REVIEWS: ProductReview[] = [
  {
    id: '1',
    product_id: '1',
    user_id: 'user1',
    user_name: 'Kofi A.',
    rating: 5,
    comment: 'Excellents glaçons ! Ils fondent très lentement, parfait pour nos cocktails. Livraison rapide aussi.',
    created_at: '2026-01-28T10:30:00Z',
    helpful_count: 12,
    verified_purchase: true,
  },
  {
    id: '2',
    product_id: '1',
    user_id: 'user2',
    user_name: 'Ama K.',
    rating: 4,
    comment: 'Bonne qualité, j\'aurais aimé un sachet un peu plus grand. Sinon rien à redire.',
    created_at: '2026-01-25T14:15:00Z',
    helpful_count: 5,
    verified_purchase: true,
  },
  {
    id: '3',
    product_id: '1',
    user_id: 'user3',
    user_name: 'Mensah E.',
    rating: 5,
    comment: 'Utilisé pour mon mariage, tout le monde était satisfait. Je recommande vivement PRO-GLAÇONS !',
    created_at: '2026-01-20T09:00:00Z',
    helpful_count: 23,
    verified_purchase: true,
  },
];

const DEMO_RATING: ProductRating = {
  product_id: '1',
  average_rating: 4.7,
  total_reviews: 156,
  rating_distribution: { 1: 2, 2: 5, 3: 12, 4: 35, 5: 102 },
};

// Composant étoiles
const StarRating: React.FC<{ rating: number; size?: number; interactive?: boolean; onChange?: (rating: number) => void }> = ({
  rating,
  size = 16,
  interactive = false,
  onChange,
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const { haptics } = useHaptics();

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => {
            if (interactive && onChange) {
              onChange(star);
              haptics.selection();
            }
          }}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          <Star
            size={size}
            className={`${
              (hoverRating || rating) >= star
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-slate-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

// Formulaire d'avis
const ReviewForm: React.FC<{ productId: string; onSubmit: (review: Partial<ProductReview>) => void; onCancel: () => void }> = ({
  productId,
  onSubmit,
  onCancel,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { haptics } = useHaptics();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    haptics.success();
    onSubmit({
      product_id: productId,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      comment,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl space-y-4">
      <h4 className="font-bold text-[#1E3A8A] dark:text-white">Donner votre avis</h4>
      
      <div>
        <label className="block text-sm text-slate-500 mb-2">Votre note</label>
        <StarRating rating={rating} size={28} interactive onChange={setRating} />
      </div>
      
      <div>
        <label className="block text-sm text-slate-500 mb-2">Votre commentaire</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre expérience avec ce produit..."
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 resize-none h-24 focus:ring-2 focus:ring-[#00ADEF] outline-none"
        />
      </div>
      
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={rating === 0}
          className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-bold hover:bg-[#00ADEF] transition-colors disabled:opacity-50"
        >
          Publier
        </button>
      </div>
    </form>
  );
};

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productName }) => {
  const { user } = useApp();
  const { haptics } = useHaptics();
  const [showForm, setShowForm] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>(DEMO_REVIEWS.filter(r => r.product_id === productId || productId === '1'));
  const [ratingData] = useState<ProductRating>(DEMO_RATING);
  const [helpfulIds, setHelpfulIds] = useState<string[]>([]);

  const handleSubmitReview = (review: Partial<ProductReview>) => {
    const newReview: ProductReview = {
      id: Date.now().toString(),
      product_id: productId,
      user_id: user?.id || 'anonymous',
      user_name: user?.full_name || 'Anonyme',
      rating: review.rating!,
      comment: review.comment || '',
      created_at: new Date().toISOString(),
      helpful_count: 0,
      verified_purchase: false,
    };
    setReviews([newReview, ...reviews]);
    setShowForm(false);
  };

  const handleHelpful = (reviewId: string) => {
    if (helpfulIds.includes(reviewId)) return;
    haptics.buttonPress();
    setHelpfulIds([...helpfulIds, reviewId]);
    setReviews(reviews.map(r => 
      r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
    ));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Résumé des notes */}
      <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#00ADEF]/5 p-6 rounded-2xl">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <div className="text-5xl font-black text-[#1E3A8A] dark:text-white">{ratingData.average_rating}</div>
            <StarRating rating={ratingData.average_rating} size={20} />
            <p className="text-sm text-slate-500 mt-1">{ratingData.total_reviews} avis</p>
          </div>
          
          <div className="flex-1 min-w-[200px] space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingData.rating_distribution[stars as keyof typeof ratingData.rating_distribution];
              const percentage = (count / ratingData.total_reviews) * 100;
              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{stars}</span>
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-slate-400 text-xs">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bouton écrire un avis */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-[#00ADEF] text-[#00ADEF] font-bold hover:bg-[#00ADEF]/5 transition-colors flex items-center justify-center gap-2"
        >
          <MessageSquare size={20} />
          Écrire un avis
        </button>
      )}

      {/* Formulaire */}
      {showForm && (
        <ReviewForm
          productId={productId}
          onSubmit={handleSubmitReview}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Liste des avis */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-700 dark:text-slate-300">Avis clients</h4>
        
        {reviews.length === 0 ? (
          <p className="text-center text-slate-400 py-8">Aucun avis pour ce produit. Soyez le premier !</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white font-bold">
                    {review.user_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1E3A8A] dark:text-white">{review.user_name}</span>
                      {review.verified_purchase && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} /> Achat vérifié
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} size={14} />
              </div>
              
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">{review.comment}</p>
              
              <button
                onClick={() => handleHelpful(review.id)}
                disabled={helpfulIds.includes(review.id)}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  helpfulIds.includes(review.id)
                    ? 'text-[#00ADEF]'
                    : 'text-slate-400 hover:text-[#00ADEF]'
                }`}
              >
                <ThumbsUp size={14} className={helpfulIds.includes(review.id) ? 'fill-current' : ''} />
                Utile ({review.helpful_count})
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
export { StarRating };
