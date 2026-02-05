export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Glaçons' | 'Ice Cup' | 'Carbo Glace' | 'Pack';
  unit: string;
  imageUrl: string;
  tag?: string;
  role?: string;
  inStock: boolean;
  stock_quantity: number;
  expiration_date?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  neighborhood?: string;
  role: 'client' | 'admin';
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Service {
  title: string;
  description: string;
  icon: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'Disponible' | 'En livraison' | 'Hors service';
  activeOrders: number;
  latitude?: number;
  longitude?: number;
  last_location_update?: string;
  is_available?: boolean;
}

export type PaymentStatus = 'pending' | 'paid' | 'unpaid' | 'refunded' | 'partial';

export interface Order {
  id: string;
  created_at: string;
  items: CartItem[];
  total: number;
  delivery_fee: number;
  status: 'En attente' | 'Préparation' | 'Livraison en cours' | 'En attente de confirmation' | 'Livré' | 'Annulé' | 'Confirmé';
  full_name: string;
  neighborhood: string;
  address: string;
  phone: string;
  driver_id?: string;
  user_id?: string;
  payment_method?: 'cash' | 'mobile_money';
  payment_status?: PaymentStatus;
  payment_date?: string;
  payment_amount?: number;
  payment_notes?: string;
  driver_latitude?: number;
  driver_longitude?: number;
  delivered_at?: string;
  confirmed_at?: string;
  confirmed_by?: 'client' | 'driver' | 'admin';
  delivery_code?: string;
  scheduled_date?: string;
  scheduled_time?: string;
}

// Transaction pour l'historique des paiements
export interface PaymentTransaction {
  id: string;
  order_id: string;
  amount: number;
  type: 'payment' | 'refund' | 'adjustment';
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'other';
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

export interface StockLog {
  id: string;
  product_id: string;
  product_name: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  type: 'in' | 'out' | 'adjustment' | 'sale';
  reason: string;
  order_id?: string;
  created_by?: string;
  created_at: string;
}

// ========================================
// SYSTÈME DE FIDÉLITÉ
// ========================================

export interface LoyaltyPoints {
  id: string;
  user_id: string;
  points: number;
  total_earned: number;
  total_spent: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  order_id?: string;
  points: number;
  type: 'earn' | 'redeem' | 'bonus' | 'expire';
  description: string;
  created_at: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  is_active: boolean;
  expires_at?: string;
}

// Configuration du système de fidélité
export const LOYALTY_CONFIG = {
  // Points gagnés par tranche de 1000 FCFA dépensés
  POINTS_PER_1000_FCFA: 10,
  
  // Bonus de bienvenue
  WELCOME_BONUS: 50,
  
  // Niveaux de fidélité
  TIERS: {
    bronze: { min: 0, multiplier: 1, name: 'Bronze', color: '#CD7F32' },
    silver: { min: 500, multiplier: 1.25, name: 'Argent', color: '#C0C0C0' },
    gold: { min: 1500, multiplier: 1.5, name: 'Or', color: '#FFD700' },
    platinum: { min: 5000, multiplier: 2, name: 'Platine', color: '#E5E4E2' }
  },
  
  // Récompenses disponibles
  REWARDS: [
    { points: 100, discount: 500, name: 'Réduction 500 FCFA' },
    { points: 250, discount: 1500, name: 'Réduction 1 500 FCFA' },
    { points: 500, discount: 3500, name: 'Réduction 3 500 FCFA' },
    { points: 1000, discount: 8000, name: 'Réduction 8 000 FCFA' },
  ]
};

// ========================================
// SYSTÈME D'AVIS CLIENTS
// ========================================

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  created_at: string;
  helpful_count: number;
  verified_purchase: boolean;
}

export interface ProductRating {
  product_id: string;
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ========================================
// SYSTÈME DE PARRAINAGE
// ========================================

export interface Referral {
  id: string;
  referrer_id: string;
  referrer_name: string;
  referee_id?: string;
  referee_name?: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'expired';
  bonus_points: number;
  created_at: string;
  completed_at?: string;
}

export interface ReferralConfig {
  referrer_bonus: number; // Points pour le parrain
  referee_bonus: number;  // Points pour le filleul
  min_order_amount: number; // Montant min pour valider
  expiry_days: number; // Jours avant expiration
}

// ========================================
// CHATBOT FAQ
// ========================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

// ========================================
// ALERTES STOCK & PRÉVISIONS
// ========================================

export interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'expiring_soon';
  threshold: number;
  current_stock: number;
  is_active: boolean;
  last_triggered?: string;
  created_at: string;
}

export interface StockAlertConfig {
  product_id: string;
  low_stock_threshold: number;
  critical_stock_threshold: number;
  expiry_warning_days: number;
  notify_email: boolean;
  notify_sms: boolean;
  notify_push: boolean;
}

export interface StockPrediction {
  product_id: string;
  product_name: string;
  current_stock: number;
  avg_daily_sales: number;
  days_until_stockout: number;
  predicted_stockout_date: string;
  recommended_restock_qty: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'increasing' | 'stable' | 'decreasing';
}

// ========================================
// CENTRE DE NOTIFICATIONS
// ========================================

export type NotificationType = 
  | 'new_order' 
  | 'order_status' 
  | 'low_stock' 
  | 'out_of_stock' 
  | 'stock_out'
  | 'payment_received' 
  | 'payment_pending'
  | 'driver_assigned'
  | 'delivery_completed'
  | 'system'
  | 'promo';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  dismissed: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: {
    order_id?: string;
    product_id?: string;
    driver_id?: string;
    amount?: number;
    stock?: number;
    date?: string;
  };
  created_at: string;
  read_at?: string;
}

export interface NotificationConfig {
  id: string;
  user_id: string;
  // Canaux de notification
  enable_push: boolean;
  enable_sound: boolean;
  enable_email: boolean;
  // Types de notifications activés
  notify_new_orders: boolean;
  notify_order_status: boolean;
  notify_low_stock: boolean;
  notify_stock_alerts: boolean;
  notify_payments: boolean;
  notify_deliveries: boolean;
  notify_system: boolean;
  // Seuils
  low_stock_threshold: number;
  // Heures de silence (ne pas déranger)
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "22:00"
  quiet_hours_end: string;   // "07:00"
  created_at: string;
  updated_at: string;
}

